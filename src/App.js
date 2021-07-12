import React, { useEffect, useState } from "react";
import * as sdk from "@onflow/sdk";

// Mainnet Access Node
const node = "https://access-mainnet-beta.onflow.org";
const EVENT_MOMENT_LISTED = "A.c1e4f4f4c4257510.Market.MomentListed";
const FETCH_INTERVAL = 5000;

// since last block returned is not sealed
// we will go back a bit back in time
const SHIFT = 5;

function union(setA, setB) {
  var _union = new Set(setA);
  for (var elem of setB) {
    _union.add(elem);
  }
  return _union;
}

export default function App() {
  const [lastBlock, setLastBlock] = useState(0);
  const [eventIDs, setEventIdS] = useState(new Set());
  const [eventsDictionary, setEventsDictionary] = useState({});

  const fetchEvents = async () => {
    const latestBlock = await sdk.send(
      await sdk.build([sdk.getLatestBlock()]),
      {
        node
      }
    );

    const height = latestBlock.block.height - SHIFT;
    let end = height;
    let start = lastBlock;
    if (lastBlock === 0) {
      start = height;
    }

    // fetch events
    const response = await sdk.send(
      await sdk.build([sdk.getEvents(EVENT_MOMENT_LISTED, start, end)]),
      { node }
    );

    const { events } = response;

    if (events.length > 0) {
      const newSet = new Set(
        events.map((event) => {
          const id = event.payload.value.fields[0].value.value;
          eventsDictionary[id] = event;
          return id;
        })
      );
      const newEvents = union(eventIDs, newSet);
      setEventsDictionary(eventsDictionary);
      setEventIdS(newEvents);
    }

    // update last processed block
    setLastBlock(height);
  };

  useEffect(() => {
    const interval = setInterval(fetchEvents, FETCH_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  });

  const events = Array.from(eventIDs);

  return (
    <div className="App">
      <p>
        Latest processed block: <b>#{lastBlock}</b>
      </p>
      <p>
        Events found: <b>{events.length}</b>
      </p>
      <table>
        <thead>
          <tr>
            <th align="left">Moment ID</th>
            <th align="right">Seller</th>
            <th align="right">Price</th>
          </tr>
        </thead>
        <tbody>
          {events.map((eventId) => {
            const event = eventsDictionary[eventId];
            const payload = event.payload.value.fields;
            const [id, price, seller] = payload;
            const momentId = id.value.value;
            const momentPrice = price.value.value;
            const momentSeller = seller.value.value.value;
            return (
              <tr>
                <td align="left">#{momentId}</td>
                <td align="right">#{momentSeller}</td>
                <td align="right">#{momentPrice}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
