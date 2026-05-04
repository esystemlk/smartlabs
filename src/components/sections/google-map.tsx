"use client";

import React from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export function GoogleMap() {
  const address = "Smart Labs, 123/A, Rajagiriya Road, Rajagiriya, Sri Lanka"; // Update with actual address
  const mapEmbedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.78544431718!2d79.888!3d6.915!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwNTQnNTQuMCJOIDc5wrA1MycyNC4wIkU!5e0!3m2!1sen!2slk!4v1700000000000!5m2!1sen!2slk`; 
  // Note: The above URL is a placeholder. For a free embed, we use the standard iframe method.

  return (
    <section className="py-24 relative overflow-hidden bg-white dark:bg-[#020617]">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Contact Info Side */}
          <div className="space-y-12">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-[0.2em]"
              >
                <MapPin className="h-3 w-3" />
                Visit Our Campus
              </motion.div>
              <h2 className="text-5xl sm:text-6xl font-black tracking-tight leading-[0.9]">
                Find Us <br />
                <span className="text-primary italic">In Person</span>
              </h2>
              <p className="text-xl text-muted-foreground font-medium leading-relaxed">
                Experience our high-tech learning environment and meet our expert instructors at our Rajagiriya campus.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-black text-lg">Address</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    No. 47/1/1, <br />
                    Kotte Rd, Rajagiriya, <br />
                    Sri Lanka
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-black text-lg">Opening Hours</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    Mon - Fri: 8:30 AM - 5:30 PM <br />
                    Sat - Sun: 9:00 AM - 4:00 PM
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-black text-lg">Phone</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    +94 77 123 4567 <br />
                    +94 11 234 5678
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-black text-lg">Email</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    hello@smartlabs.lk <br />
                    support@smartlabs.lk
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative h-[600px] w-full rounded-[48px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl"
          >
            <iframe
              title="Smart Labs Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.785368688487!2d79.88836527582531!3d6.916327618477755!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae259174092d60b%3A0xc3c945145f470125!2sSmart%20Labs!5e0!3m2!1sen!2slk!4v1714820000000!5m2!1sen!2slk"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale-[0.2] contrast-[1.1] brightness-[1.05] dark:invert dark:hue-rotate-180 dark:brightness-[0.8] dark:contrast-[1.2]"
            ></iframe>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
