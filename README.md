# 🦍 n4design-h-react

## Stack

- Bundling with Vite
- Strict TypeScript & ESNext
- UIKit & SCSS for styling

## Install and run

1. `pnpm i` to install
2. `pnpm start` to build and run

## Running with local Handle SDK

1. In this repo, run `pnpm link ../handle-sdk` to use the locally linked package, assuming it is in the same directory.
2. After making an SDK change, run `pnpm build` in the SDK to reflect the changes in React.

If there are any issues, try:

1. `pnpm unlink handle-sdk` in this repo's directory
2. Delete this repo's node_modules & dist folders
3. `pnpm i` to reinstall
4. Link again, using the steps from the guide above
5. `pnpm start` to build and run
6. Alternatively you can change the "handle-sdk" entry in package.json to "file:../handle-sdk" to directly link and run `pnpm i` then `pnpm start`

## Running with local Handle react-components

1. In this repo, run `pnpm link ../react-components` to use the locally linked package, assuming it is in the same directory.
2. After making a react-components change, run `pnpm build` in react-components to reflect the changes in React.

If there are any issues, try:

1. `pnpm unlink @handle-fi/react-components` in this repo's directory
2. Delete this repo's node_modules & dist folders
3. `pnpm i` to reinstall
4. Link again, using the steps from the guide above
5. `pnpm start` to build and run
6. Alternatively you can change the "@handle-fi/react-components" entry in package.json to "file:../react-components" to directly link and run `pnpm i` then `pnpm start`

## Running with local forked chain

`hardhat.config.js` contains the settings for which chain is to be forked. The default is Arbitrum and the following instructions assume that is the network you wish to fork locally.
We run the local chain under the same chain id as the forked network because failure to do so
causes errors with the hardcoded multicall contract in the multicall-ethers package. Sadly this means you have to change the RPC of the Arbitrum network in Metamask. At some point it is probably worth making a PR to mulitcall-ethers.

- In .env
  - `VITE_ARBITRUM_RPC=http://127.0.0.1:8545`
  - `VITE_USE_THE_GRAPH=false`
- Add the local network to Metamask by clicking on the active accounts picture in the top right -> settings -> networks -> Arbitrum and set the RPC to `http://localhost:8545`
- In two separate terminals, run `npx hardhat node` and `pnpm start`.
