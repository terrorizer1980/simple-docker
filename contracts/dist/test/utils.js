"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@connext/utils");
const buidler_1 = require("@nomiclabs/buidler");
const chai = __importStar(require("chai"));
const ethereum_waffle_1 = require("ethereum-waffle");
const chai_1 = require("chai");
const utils_2 = require("ethers/utils");
function mkXpub(prefix = "xpub") {
    return prefix.padEnd(111, "0");
}
exports.mkXpub = mkXpub;
function mkAddress(prefix = "0x") {
    return prefix.padEnd(42, "0");
}
exports.mkAddress = mkAddress;
function mkHash(prefix = "0x") {
    return prefix.padEnd(66, "0");
}
exports.mkHash = mkHash;
function mkSig(prefix = "0x") {
    return prefix.padEnd(132, "0");
}
exports.mkSig = mkSig;
exports.provider = buidler_1.waffle.provider;
exports.mineBlock = async () => await exports.provider.send("evm_mine", []);
exports.snapshot = async () => await exports.provider.send("evm_snapshot", []);
exports.restore = async (snapshotId) => await exports.provider.send("evm_revert", [snapshotId]);
exports.moveToBlock = async (blockNumber) => {
    const desired = utils_1.toBN(blockNumber);
    const current = utils_1.toBN(await exports.provider.getBlockNumber());
    if (current.gt(desired)) {
        throw new Error(`Already at block ${current.toNumber()}, cannot rewind to ${blockNumber.toString()}`);
    }
    if (current.eq(desired)) {
        return;
    }
    for (const _ of Array(desired.sub(current).toNumber())) {
        await exports.mineBlock();
    }
    const final = utils_1.toBN(await exports.provider.getBlockNumber());
    exports.expect(final).to.be.eq(desired);
};
chai_1.use(require("chai-subset"));
chai_1.use(ethereum_waffle_1.solidity);
exports.expect = chai.use(ethereum_waffle_1.solidity).expect;
exports.fund = async (amount, recipient) => {
    for (const wallet of await exports.provider.getWallets()) {
        if (wallet.address === recipient.address) {
            continue;
        }
        const current = await exports.provider.getBalance(recipient.address);
        const diff = amount.sub(current);
        if (diff.lte(0)) {
            return;
        }
        const funderBalance = await exports.provider.getBalance(wallet.address);
        const fundAmount = funderBalance.sub(utils_2.parseEther("1"));
        if (fundAmount.lte(0)) {
            continue;
        }
        await wallet.sendTransaction({
            to: recipient.address,
            value: fundAmount.gt(diff) ? diff : fundAmount,
        });
    }
    const final = await exports.provider.getBalance(recipient.address);
    if (final.lt(amount)) {
        throw new Error(`Insufficient funds after funding to max. Off by: ${final
            .sub(amount)
            .abs()
            .toString()}`);
    }
};
function sortByAddress(a, b) {
    return utils_1.toBN(a).lt(utils_1.toBN(b)) ? -1 : 1;
}
exports.sortByAddress = sortByAddress;
function sortAddresses(addrs) {
    return addrs.sort(sortByAddress);
}
exports.sortAddresses = sortAddresses;
async function sortSignaturesBySignerAddress(digest, signatures) {
    return (await Promise.all(signatures.map(async (sig) => ({ sig, addr: await utils_1.verifyChannelMessage(digest, sig) }))))
        .sort((a, b) => sortByAddress(a.addr, b.addr))
        .map(x => x.sig);
}
exports.sortSignaturesBySignerAddress = sortSignaturesBySignerAddress;
//# sourceMappingURL=utils.js.map