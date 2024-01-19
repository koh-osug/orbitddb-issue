import { createOrbitDB } from '@orbitdb/core'
import { create } from 'ipfs-core'
import { v4 as uuidv4 } from 'uuid';
import {EventEmitter} from "events";

const config1 = {
  Addresses: {
    API: '/ip4/127.0.0.1/tcp/0',
    Swarm: ['/ip4/0.0.0.0/tcp/0'],
    Gateway: '/ip4/0.0.0.0/tcp/0',
    NoAnnounce: [
    ]
  },
  Swarm: {
    AddrFilters: null,
  },
  Bootstrap: [],
  Discovery: {
    MDNS: {
      Enabled: true,
      Interval: 0
    }
  },
  Routing: {
    Routers: {
      Type: "dht",
      Parameters: {
        Mode: "auto",
        PublicIPNetwork: false,
        AcceleratedDHTClient: false
      }
    }
  }
}

const config2 = {
  Addresses: {
    API: '/ip4/127.0.0.1/tcp/0',
    Swarm: ['/ip4/0.0.0.0/tcp/0'],
    Gateway: '/ip4/0.0.0.0/tcp/0',
    NoAnnounce: [
    ]
  },
  Swarm: {
    AddrFilters: null,
  },
  Bootstrap: [],
  Discovery: {
    MDNS: {
      Enabled: true,
      Interval: 0
    }
  },
  Routing: {
    Routers: {
      Type: "dht",
      Parameters: {
        Mode: "auto",
        PublicIPNetwork: false,
        AcceleratedDHTClient: false
      }
    }
  }
}

EventEmitter.defaultMaxListeners = 0;

const ipfs1 = await create({ preload: { enabled: false }, offline: false, EXPERIMENTAL: { pubsub: true }, config: config1, repo: './ipfs/1' })
const ipfs2 = await create({ preload: { enabled: false }, offline: false, EXPERIMENTAL: { pubsub: true }, config: config2, repo: './ipfs/2' })

const orbitdb1 = await createOrbitDB({ ipfs: ipfs1, id: 'test1', directory: './orbitdb/1' })
const orbitdb2 = await createOrbitDB({ ipfs: ipfs2, id: 'test2', directory: './orbitdb/2' })

// This opens a new db. Default db type will be 'events'.
const db1 = await orbitdb1.open('subscription-data', {type: 'documents'})

for (let i=0; i<2; i++) {
  console.log("putting data", i)
  await db1.put({_id: uuidv4(), content: "content "+i})
}

const db2 = await orbitdb2.open(db1.address)

let updateCount=0
db2.events.on('update', async (entry) => {
  console.log(`new entry ${updateCount++}:\n`, entry)
})

async function handleTerminationSignal() {
  console.log('Received termination signal. Cleaning up and exiting...');
  await db1.close()
  await db2.close()
  await orbitdb1.stop()
  await orbitdb2.stop()
  await ipfs1.stop()
  await ipfs2.stop()
  process.exit();
}

process.on('SIGTERM', handleTerminationSignal);
process.on('SIGINT', handleTerminationSignal);
console.log('Script is running. Press CTRL+C to terminate.');

