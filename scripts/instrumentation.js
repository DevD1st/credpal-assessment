// scripts/instrumentation.js
// Preloaded via NODE_OPTIONS="--import=../../scripts/instrumentation.js"
// Plain JS so Node can --import it without any compilation step.
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";

const sdk = new NodeSDK({
  serviceName: process.env.SERVICE || process.env.npm_package_name || "credpal",
  traceExporter: new ConsoleSpanExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
console.log("✅ OpenTelemetry SDK started");

const shutdown = () =>
  sdk
    .shutdown()
    .then(() => console.log("Instrumentation terminated"))
    .catch(() => console.log("Error terminating instrumentation"));

process.on("SIGTERM", shutdown);
