/// <reference types="chai" />
import { BigNumber, BigNumberish } from "ethers/utils";
import { Wallet } from "ethers";
export declare function mkXpub(prefix?: string): string;
export declare function mkAddress(prefix?: string): string;
export declare function mkHash(prefix?: string): string;
export declare function mkSig(prefix?: string): string;
export declare const provider: import("ethereum-waffle").MockProvider;
export declare const mineBlock: () => Promise<any>;
export declare const snapshot: () => Promise<any>;
export declare const restore: (snapshotId: any) => Promise<any>;
export declare const moveToBlock: (blockNumber: BigNumberish) => Promise<void>;
export declare const expect: Chai.ExpectStatic;
export declare const fund: (amount: BigNumber, recipient: Wallet) => Promise<void>;
export declare function sortByAddress(a: string, b: string): 1 | -1;
export declare function sortAddresses(addrs: string[]): string[];
export declare function sortSignaturesBySignerAddress(digest: string, signatures: string[]): Promise<string[]>;
//# sourceMappingURL=utils.d.ts.map