import BigNumber from "bignumber.js";

// Test net
export const TEST_CSPD_ADDRESS = '0x09DCDABA867391015c4DAD1ABA04fd0FF4F1DBcD';

// export const TEST_STAKING_ADDRESS = '0xc29A2c04fA0C85faC17045Ac2057a8F1fc16FCed';
// export const TEST_STAKING_ADDRESS = '0xC7C6Cfdd06Fbd77D704F70936D5588880058cD4C';

export const TEST_STAKING_ADDRESS_V0 = '0xC7C6Cfdd06Fbd77D704F70936D5588880058cD4C';

export const TEST_STAKING_ADDRESS_V1 = '0xc29A2c04fA0C85faC17045Ac2057a8F1fc16FCed';

export const TEST_STAKING_ADDRESS_V2 = '0xec0C5b2497Ef48D002DF03e13dc08Fcb4713b67E';

// Main net
export const MAIN_CSPD_ADDRESS = '0xef9481115ff33E94d3E28A52D3A8F642bf3521e5';

export const MAIN_STAKING_ADDRESS_V0 = '0x3acD73F0a3DbC022ef7806203C34839d3e263aE5'

export const MAIN_STAKING_ADDRESS_V1 = '0x1a2Cd2Ce0fE93965487e7AceA9132a5C44477F94';

export const MAIN_STAKING_ADDRESS_V2 = '0xCdbeFB81809D39F7217bc90bF3560BEd89b86917';

export const BINANCE_TEST = "https://data-seed-prebsc-1-s1.binance.org:8545/";

export const BINANCE_BLOCKEXPLORER_TEST = "https://testnet.bscscan.com/";

export const CHAINID_TEST = "0x61";

export const BINANCE_MAIN = "https://bsc-dataseed.binance.org/";

export const BINANCE_BLOCKEXPLORER_MAIN = "https://bscscan.com/";

export const CHAINID_MAIN = "0x38";

export const DECIMAL = 18;

export function toWEI(number){
    return BigNumber(number).shiftedBy(DECIMAL);
}

export function fromWEI(number){
    return BigNumber(number).shiftedBy(-1 * DECIMAL).toNumber();
}

export const moralisTestnetServerURL = "https://w2dohzd0ize1.usemoralis.com:2053/server";

export const moralisTestnetAppID = "2WUmLjcRrZ6KpG9GO3elRqbICQ1ss3wzft2Tnfic";

export const moralisMainnetServerURL = "https://yt8ws6xnmxfc.usemoralis.com:2053/server";

export const moralisMainnetAppID = "h0yDqBdScabYLhvwihcrZsv0hXaTYUImod15LWNk";

export const mainStartBlockNumber = "15170577";

export const testStartBlockNumber = "16659487";