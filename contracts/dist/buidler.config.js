"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nomiclabs/buidler/config");
const utils_1 = require("ethers/utils");
const MAX_INT = new utils_1.BigNumber(2).pow(256).sub(1);
config_1.usePlugin("@nomiclabs/buidler-waffle");
const config = {
    paths: {
        sources: "./contracts",
        tests: "./test",
        artifacts: "./build",
    },
    solc: {
        version: "0.5.11",
        evmVersion: "constantinople",
    },
    defaultNetwork: "buidlerevm",
    networks: {
        ganache: {
            chainId: 4447,
            url: "http://localhost:8545",
        },
        buidlerevm: {
            loggingEnabled: false,
            accounts: [
                {
                    privateKey: "0xf8db28f19cfb75625e0c100de3de8be364f2f4a6d77ff3b3ea361b93bef625dd",
                    balance: MAX_INT.div(2).toString(),
                },
                {
                    privateKey: "0xbce6e7f2cbb131f5538b052f433b381c0738d37c3df2d667d023ee10adbb33f0",
                    balance: MAX_INT.div(2).toString(),
                },
                {
                    privateKey: "0x5454ba77acd18c6cef9dd471a7bc57d8ff261433a2c2d90049659fe68eaf1de4",
                    balance: MAX_INT.div(2).toString(),
                },
                {
                    privateKey: "0x615ff2525e11be7b323e699e720378641ea2c418d829d065e74d1fd70a44706b",
                    balance: MAX_INT.div(2).toString(),
                },
                {
                    privateKey: "0x20a88167e85946376ba44cf26f347c2f6d3d4f6e3302bda1990355d267c22051",
                    balance: MAX_INT.div(2).toString(),
                },
            ],
        },
    },
};
exports.default = config;
//# sourceMappingURL=buidler.config.js.map