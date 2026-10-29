// This switch is valid only on the isolated local demonstration profile.
export const demoSelfService=()=>process.env.ARENA_LOAD_DEMO==='1'&&process.env.DEMO_SELF_SERVICE==='1';
export const validDemoEmail=email=>typeof email==='string'&&email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// Reversible presentation policy; does not grant organizer rights or change locked rules.
export const demoOpenEntry=()=>process.env.DEMO_OPEN_ENTRY==='1';
export const acceptsOpenEntry=config=>demoOpenEntry()||config?.entryMode==='open';
