/**
 * Koppeling tussen je telefoon en het tv-scherm.
 *
 * Casten is alleen nodig om de tv-pagina één keer op het scherm te krijgen.
 * Daarna praten telefoon en tv rechtstreeks met elkaar via een MQTT-broker —
 * los van Cast, AirPlay of welk protocol dan ook. Daardoor werkt dit met een
 * Chromecast, een oude tablet, een Raspberry Pi of gewoon een tweede laptop.
 *
 * Er is geen account of server voor nodig. De koppelcode bepaalt op welk
 * kanaal je uitzendt; alleen wie die code heeft, ziet je scherm.
 */

const BROKERS = [
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://broker.emqx.io:8084/mqtt',
];

/** Korte, goed voor te lezen code. Geen 0/O/1/I om verwarring te voorkomen. */
export function newPairCode() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const a = new Uint8Array(8);
  (globalThis.crypto || {}).getRandomValues?.(a);
  return [...a].map(n => abc[n % abc.length]).join('');
}

function topicFor(code) { return `smrtftnss/${code}/state`; }

/**
 * Maak een verbinding. `role` is alleen voor de client-id.
 * Geeft { publish, close, onStatus } terug.
 */
export function connect(code, { role = 'phone', brokerUrl = null, onState = null, onStatus = null } = {}) {
  const lib = globalThis.mqtt;
  if (!lib) { onStatus?.('geen-lib'); return { publish() {}, close() {} }; }

  const urls = brokerUrl ? [brokerUrl, ...BROKERS]
    : (globalThis.__BROKER ? [globalThis.__BROKER] : BROKERS);   // testhaakje
  let idx = 0, client = null, dood = false, laatste = null;

  const verbind = () => {
    if (dood) return;
    const url = urls[idx % urls.length];
    onStatus?.('verbinden');
    client = lib.connect(url, {
      clientId: `smrt_${role}_${Math.random().toString(16).slice(2, 10)}`,
      keepalive: 30,
      reconnectPeriod: 0,      // we regelen het zelf, zodat we kunnen wisselen van broker
      connectTimeout: 8000,
      clean: true,
    });
    client.on('connect', () => {
      onStatus?.('verbonden');
      client.subscribe(topicFor(code), { qos: 0 });
      // De tv start meestal later dan de telefoon: stuur de laatste stand nog eens.
      if (laatste) client.publish(topicFor(code), JSON.stringify(laatste), { qos: 0, retain: true });
    });
    client.on('message', (_t, buf) => {
      try { onState?.(JSON.parse(buf.toString())); } catch { /* rommel negeren */ }
    });
    const opnieuw = () => {
      if (dood) return;
      try { client?.end(true); } catch { /* ok */ }
      idx += 1;
      onStatus?.('opnieuw');
      setTimeout(verbind, 1500);
    };
    client.on('error', opnieuw);
    client.on('close', opnieuw);
  };
  verbind();

  return {
    publish(state) {
      laatste = state;
      // retain: de tv pikt de laatste stand op zodra hij verbindt, ook als hij
      // later start dan de telefoon.
      try { client?.connected && client.publish(topicFor(code), JSON.stringify(state), { qos: 0, retain: true }); } catch { /* ok */ }
    },
    close() { dood = true; try { client?.end(true); } catch { /* ok */ } },
  };
}
