# Local admin controls

The project intentionally keeps the interface approachable. The admin actions can be triggered from a second terminal while `npm run dev` is running.

Start the election:

```bash
curl -X POST http://127.0.0.1:3001/api/admin/start
```

End and finalize the election:

```bash
curl -X POST http://127.0.0.1:3001/api/admin/end
```

Only the first local Hardhat account is authorized by the smart contract to run these actions. These endpoints are for local development only.
