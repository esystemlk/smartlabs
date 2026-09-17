const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Execute the actual page callbacks with an isolated Firebase/router harness.
// No real accounts are created and no email or database requests are sent.
function callback(page, name) {
  const file = path.join(__dirname, '..', 'src', 'app', page, 'page.tsx');
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let found;
  function visit(node) {
    if (name && ts.isVariableDeclaration(node) && node.name.getText(source) === name) found = node.initializer;
    if (!name && ts.isFunctionDeclaration(node) && node.name?.text === 'DashboardPage') {
      found = node.body.statements.find(statement => ts.isExpressionStatement(statement)
        && ts.isCallExpression(statement.expression)
        && statement.expression.expression.getText(source) === 'useEffect').expression.arguments[0];
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(found, `Missing callback in ${page}`);
  return ts.transpileModule(`(${found.getText(source)})`, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  }).outputText;
}

function harness(data, exists = true) {
  const routes = [];
  const roles = [];
  return {
    routes, roles,
    context: {
      firestore: {}, user: { uid: 'test-user', email: 'learner@example.com' }, isUserLoading: false,
      ADMIN_EMAILS: ['admin@smartlabs.com', 'thimira.vishwa2003@gmail.com'],
      doc: () => ({}), getDoc: async () => ({ exists: () => exists, data: () => data }),
      setDoc: async () => {}, updateDoc: async () => {}, serverTimestamp: () => 0,
      incrementStudentCount: async () => {}, logUserActivity: async () => {},
      router: { push: route => routes.push(route) },
      setUserRole: role => roles.push(role), setIsLoading: () => {}, setShowSuccess: () => {},
      setTimeout: fn => fn(), toast: () => {}, handleAuthError: error => { throw error; },
    },
  };
}

for (const onboarding of [false, undefined, true]) {
  for (const page of ['login', 'signup']) {
    test(`${page}: student with onboarding=${onboarding} reaches dashboard`, async () => {
      const h = harness({ role: 'user', hasCompletedOnboarding: onboarding });
      await vm.runInNewContext(callback(page, 'handleAuthSuccess'), h.context)(h.context.user);
      assert.deepEqual(h.routes, ['/dashboard']);
    });
  }
  test(`dashboard: onboarding=${onboarding} does not eject a signed-in student`, async () => {
    const h = harness({ role: 'user', hasCompletedOnboarding: onboarding });
    vm.runInNewContext(callback('dashboard'), h.context)();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(h.routes, []);
    assert.deepEqual(h.roles, ['user']);
  });
}

for (const page of ['login', 'signup']) {
  test(`${page}: newly created student profile reaches dashboard`, async () => {
    const h = harness({}, false);
    await vm.runInNewContext(callback(page, 'handleAuthSuccess'), h.context)(h.context.user, 'New Learner');
    assert.deepEqual(h.routes, ['/dashboard']);
  });
  test(`${page}: staff still reaches the staff dashboard`, async () => {
    const h = harness({ role: 'admin', hasCompletedOnboarding: false });
    await vm.runInNewContext(callback(page, 'handleAuthSuccess'), h.context)(h.context.user);
    assert.deepEqual(h.routes, ['/admin/dashboard']);
  });
}

test('dashboard: signed-out visitors still go to login', () => {
  const h = harness({});
  h.context.user = null;
  vm.runInNewContext(callback('dashboard'), h.context)();
  assert.deepEqual(h.routes, ['/login']);
});

test('dashboard: wait for authentication before redirecting', () => {
  const h = harness({});
  h.context.user = null;
  h.context.isUserLoading = true;
  vm.runInNewContext(callback('dashboard'), h.context)();
  assert.deepEqual(h.routes, []);
});

test('dashboard: a missing user document still goes to login', async () => {
  const h = harness({}, false);
  vm.runInNewContext(callback('dashboard'), h.context)();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(h.routes, ['/login']);
});
