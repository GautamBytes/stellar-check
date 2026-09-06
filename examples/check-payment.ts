import { readFile } from 'node:fs/promises';
import { assessPayment, checkPayment, HorizonProvider } from '../src/index.js';
import { scenario, scenarioNames } from './scenarios.js';
// With a JSON intent file, fetch current state. Without arguments, run four offline fixtures.
const file = process.argv[2];
if (file) {
  const input: unknown = JSON.parse(await readFile(file, 'utf8'));
  const horizon = process.env.HORIZON_URL;
  if (!horizon) throw new Error('Set HORIZON_URL to your chosen network provider.');
  console.log(JSON.stringify(await checkPayment(input, new HorizonProvider(horizon)), null, 2));
} else {
  for (const name of Object.keys(scenarioNames) as (keyof typeof scenarioNames)[]) {
    const { payment, snapshot } = scenario(name);
    const report = assessPayment(payment, snapshot);
    console.log(
      JSON.stringify(
        { scenario: scenarioNames[name], mode: 'controlled fixture', report },
        null,
        2,
      ),
    );
  }
}
