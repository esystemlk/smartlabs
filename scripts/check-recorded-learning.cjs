// Read-only connection check; never prints keys, student records or private URLs.
const admin=require('firebase-admin');require('@next/env').loadEnvConfig(process.cwd());
async function main(){
  const app=admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_CONFIG))},'recorded-learning-check');
  const db=app.firestore();
  try{
    const [packages,classes,shared]=await Promise.all([db.collection('recorded_packages').get(),db.collection('recorded_classes').get(),db.collection('recorded_learning_items').get()]);
    const output={packages:packages.size,publishedPackages:packages.docs.filter(doc=>doc.data().published!==false).length,courseVideos:classes.size,sharedItems:shared.size,embedSigningConfigured:!!(process.env.BUNNY_STREAM_EMBED_KEYS||process.env.BUNNY_STREAM_EMBED_TOKEN_KEY),lmsConnected:false,bunnyApiStatus:null,embedHttpStatus:null};
    if(process.env.LMS_ADMIN_CONFIG){
      const lms=admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.LMS_ADMIN_CONFIG))},'recorded-learning-lms-check');
      try{const settings=(await lms.firestore().collection('settings').doc('general').get()).data()||{};output.lmsConnected=true;if(settings.bunnyLibraryId&&settings.bunnyApiKey){const response=await fetch(`https://video.bunnycdn.com/library/${settings.bunnyLibraryId}/videos?itemsPerPage=1`,{headers:{AccessKey:settings.bunnyApiKey},signal:AbortSignal.timeout(15000)});output.bunnyApiStatus=response.status}}finally{await lms.delete()}
    }
    const first=classes.docs.find(doc=>doc.data().published!==false&&doc.data().bunnyLibraryId&&doc.data().bunnyVideoId)?.data();
    if(first){const response=await fetch(`https://iframe.mediadelivery.net/embed/${first.bunnyLibraryId}/${first.bunnyVideoId}?autoplay=false`,{headers:{Referer:process.env.NEXT_PUBLIC_APP_URL||'https://smartlabs.lk/'},signal:AbortSignal.timeout(15000)});output.embedHttpStatus=response.status;}
    console.log(JSON.stringify(output));
  }finally{await app.delete()}
}
main().catch(()=>{console.error('Connection check could not finish. No credentials were printed.');process.exitCode=1});
