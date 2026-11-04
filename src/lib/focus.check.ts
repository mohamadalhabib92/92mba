import { focusCases } from './focus.cases';

// Clés existantes de l’app : elles ne doivent jamais être lues ni écrites par le Mode Focus.
void (async () => {
  for (const c of focusCases('92mba:focus@v1', ['92mba:v1', '92mba:vibrations@v1'])) {
    try {
      await c.run();
      console.log(`ok — Mode Focus — ${c.name}`);
    } catch (e) {
      console.error(`ÉCHEC — Mode Focus — ${c.name}`);
      throw e;
    }
  }
})().catch((e) => {
  console.error(e);
  (globalThis as unknown as { process: { exit: (n: number) => void } }).process.exit(1);
});
