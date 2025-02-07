export * from "./providers/wallet";
export * from "./types";

import type { Plugin } from "@ai16z/eliza";
import { evmWalletProvider } from "./providers/wallet";
import { reviewAction } from "./actions/review";
import { queryAction } from "./actions/query";

export const QuestWebPlugin: Plugin = {
    name: "QuestWeb",
    description: "QuestWeb integration plugin",
    providers: [evmWalletProvider],
    evaluators: [],
    services: [],
    actions: [reviewAction, queryAction],
};

export default QuestWebPlugin;
