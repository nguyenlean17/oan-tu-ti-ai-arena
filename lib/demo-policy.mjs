// This switch is valid only on the isolated local demonstration profile.
export const demoSelfService=()=>process.env.ARENA_LOAD_DEMO==='1'&&process.env.DEMO_SELF_SERVICE==='1';
export const validDemoEmail=email=>typeof email==='string'&&email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
