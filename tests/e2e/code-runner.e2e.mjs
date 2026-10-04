// Code runner end-to-end: two users in a room, every installed language compiled/run in Piston,
// stdin answered by the *other* participant, compile errors, and stopping a blocking program.
// Run: TEST_PASSWORD=... node tests/e2e/code-runner.e2e.mjs   (see tests/e2e/README.md)
import { createRequire } from 'node:module'
const require = createRequire(new URL('../../frontend/package.json', import.meta.url))
const { Client } = require('@stomp/stompjs')

const API = process.env.API ?? 'http://localhost:8080'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let failures = 0
const check = (ok, msg) => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`) }

async function login(email) {
  const res = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: process.env.TEST_PASSWORD }) })
  if (!res.ok) throw new Error(`login ${email}: ${res.status}`)
  return res.headers.get('authorization').slice(7)
}
const api = (token) => async (method, path, body) => {
  const res = await fetch(`${API}${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${text}`)
  return text ? JSON.parse(text) : null
}

function connect(ticket, code) {
  const events = [], waiters = []
  const client = new Client({ brokerURL: `${API.replace(/^http/, 'ws')}/ws-signal/websocket`, connectHeaders: { ticket }, reconnectDelay: 0, debug: () => {} })
  const ready = new Promise((resolve, reject) => {
    client.onConnect = () => {
      client.subscribe(`/topic/room/${code}/run`, (m) => { events.push(JSON.parse(m.body)); waiters.forEach((w) => w()) })
      resolve()
    }
    client.onStompError = (f) => reject(new Error(f.headers.message))
  })
  client.activate()
  const send = (type, payload) => client.publish({ destination: '/app/signal.send', body: JSON.stringify({ type, roomId: code, payload: payload ?? null }) })
  const waitFor = (pred, ms = 60000) =>
    new Promise((resolve, reject) => {
      const check = () => { const hit = events.find(pred); if (hit) { waiters.splice(waiters.indexOf(check), 1); clearTimeout(t); resolve(hit) } }
      const t = setTimeout(() => { waiters.splice(waiters.indexOf(check), 1); reject(new Error(`timeout; last events=${JSON.stringify(events.slice(-4))}`)) }, ms)
      waiters.push(check); check()
    })
  const output = (runId) => events.filter((e) => e.runId === runId && ['stdout', 'stderr', 'stdin'].includes(e.type)).map((e) => e.data).join('')
  return { ready, send, waitFor, events, output, close: () => client.deactivate() }
}

const PROGRAMS = {
  python: `name = input("What's your name? ")\nprint(f"Hello, {name}!")\n`,
  javascript: `const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout })\nrl.question("What's your name? ", (n) => { console.log(\`Hello, \${n}!\`); rl.close(); process.stdin.destroy() })\n`,
  typescript: `const greet = (n: string): string => \`Hello, \${n}!\`\nconsole.log(greet('Bob'))\n`,
  c: `#include <stdio.h>\nint main(void){char n[100];printf("What's your name? ");fflush(stdout);scanf("%99s",n);printf("Hello, %s!\\n",n);return 0;}\n`,
  'c++': `#include <iostream>\n#include <string>\nint main(){std::string n;std::cout<<"What's your name? "<<std::flush;std::getline(std::cin,n);std::cout<<"Hello, "<<n<<"!"<<std::endl;}\n`,
  java: `import java.util.Scanner;\npublic class Main{public static void main(String[] a){Scanner in=new Scanner(System.in);System.out.print("What's your name? ");System.out.flush();String n=in.nextLine();System.out.println("Hello, "+n+"!");}}\n`,
  go: `package main\nimport "fmt"\nfunc main(){var n string;fmt.Print("What's your name? ");fmt.Scanln(&n);fmt.Printf("Hello, %s!\\n",n)}\n`,
  rust: `use std::io::{self,Write};\nfn main(){print!("What's your name? ");io::stdout().flush().unwrap();let mut n=String::new();io::stdin().read_line(&mut n).unwrap();println!("Hello, {}!",n.trim());}\n`,
  csharp: `using System;\npublic class Program{public static void Main(){Console.Write("What's your name? ");string n=Console.ReadLine();Console.WriteLine($"Hello, {n}!");}}\n`,
}

const [aT, bT] = await Promise.all([login('alice.runner@innerview.test'), login('bob.runner@innerview.test')])
const alice = api(aT), bob = api(bT)
const { roomId: code } = await alice('POST', '/api/interviews/instant', {
  interviewType: 'PROBLEM_SOLVING', roomSize: 'ONE_ON_ONE', creatorInterviewRole: 'INTERVIEWER', invitees: [{ email: 'bob.runner@innerview.test', role: 'INTERVIEWEE' }],
})
const A = connect((await alice('POST', `/api/rooms/${code}/join`)).ticket, code)
const B = connect((await bob('POST', `/api/rooms/${code}/join`)).ticket, code)
await Promise.all([A.ready, B.ready])
const installed = new Set((await alice('GET', '/api/code-runner/runtimes')).map((r) => r.language))

for (const [language, source] of Object.entries(PROGRAMS)) {
  if (!installed.has(language)) { console.log(`SKIP ${language} (not installed in Piston)`); continue }
  const mark = A.events.length
  A.send('RUN_CODE', { language, plainText: source })
  const started = await B.waitFor((e) => e.type === 'started' && B.events.indexOf(e) >= mark && e.language === language)
  if (language !== 'typescript') {
    await B.waitFor((e) => e.runId === started.runId && e.type === 'stdout' && B.output(started.runId).includes('name?'))
    B.send('RUN_STDIN', { data: 'Bob\n' }) // the other participant answers the prompt
  }
  await A.waitFor((e) => e.runId === started.runId && e.type === 'finished')
  const exit = A.events.filter((e) => e.runId === started.runId && e.type === 'exit').pop()
  const out = A.output(started.runId)
  check(out.includes('Hello, Bob!') && exit?.code === 0 && B.output(started.runId) === out, `${language.padEnd(10)} exit=${exit?.code} ${JSON.stringify(out)}`)
}

let mark = A.events.length
A.send('RUN_CODE', { language: 'c++', plainText: 'int main() { return x; }' })
const ce = await A.waitFor((e) => e.type === 'started' && A.events.indexOf(e) >= mark)
await A.waitFor((e) => e.runId === ce.runId && e.type === 'finished')
const ceExit = A.events.find((e) => e.runId === ce.runId && e.type === 'exit' && e.stage === 'compile')
check(ceExit && ceExit.code !== 0, `compile error reported (stage=${ceExit?.stage}, code=${ceExit?.code})`)

mark = A.events.length
A.send('RUN_CODE', { language: 'python', plainText: 'while True:\n    print(input())\n' })
const loop = await A.waitFor((e) => e.type === 'started' && A.events.indexOf(e) >= mark)
await A.waitFor((e) => e.runId === loop.runId && e.type === 'stage' && e.stage === 'run')
B.send('RUN_STDIN', { data: 'echo me\n' })
await A.waitFor((e) => e.runId === loop.runId && e.type === 'stdout' && e.data.includes('echo me'))
B.send('RUN_STOP')
await A.waitFor((e) => e.runId === loop.runId && e.type === 'finished', 10000)
check(A.events.some((e) => e.runId === loop.runId && e.type === 'stopped'), 'blocking program stopped by the other participant')

await alice('POST', `/api/rooms/${code}/end`)
await A.close(); await B.close()
await sleep(200)
console.log(failures ? `${failures} FAILURE(S)` : 'ALL PASSED')
process.exit(failures ? 1 : 0)
