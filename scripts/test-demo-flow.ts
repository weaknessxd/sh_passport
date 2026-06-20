const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000'

async function main() {
  const d = (await (await fetch(`${BASE}/api/demo-init`)).json()) as { initData?: string; error?: string }
  if (!d.initData) {
    console.log('❌ demo-init:', JSON.stringify(d))
    process.exit(1)
  }
  console.log('✅ demo-init вернул initData')

  const v = await fetch(`${BASE}/api/auth/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData: d.initData }),
  })
  const vj = (await v.json()) as Record<string, unknown>
  if (v.status === 200) {
    console.log('✅ auth/validate 200 — демо-юзер:', JSON.stringify((vj.user as { id?: number; first_name?: string })))
  } else {
    console.log(`❌ auth/validate ${v.status}:`, JSON.stringify(vj))
    process.exit(1)
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
