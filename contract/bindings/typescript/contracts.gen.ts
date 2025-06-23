import { DojoProvider, DojoCall } from "@dojoengine/core";
import { Account, AccountInterface, BigNumberish, CairoOption, CairoCustomEnum, ByteArray } from "starknet";
import * as models from "./models.gen";

export function setupWorld(provider: DojoProvider) {

	const build_actions_burnAsset_calldata = (gameId: BigNumberish, asset: CairoCustomEnum): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "burn_asset",
			calldata: [gameId, asset],
		};
	};

	const actions_burnAsset = async (snAccount: Account | AccountInterface, gameId: BigNumberish, asset: CairoCustomEnum) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_burnAsset_calldata(gameId, asset),
				"playerzero",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_buyAsset_calldata = (gameId: BigNumberish, asset: CairoCustomEnum): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "buy_asset",
			calldata: [gameId, asset],
		};
	};

	const actions_buyAsset = async (snAccount: Account | AccountInterface, gameId: BigNumberish, asset: CairoCustomEnum) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_buyAsset_calldata(gameId, asset),
				"playerzero",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_createGame_calldata = (maxRounds: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "create_game",
			calldata: [maxRounds],
		};
	};

	const actions_createGame = async (snAccount: Account | AccountInterface, maxRounds: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_createGame_calldata(maxRounds),
				"playerzero",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_joinGame_calldata = (gameId: BigNumberish, playerName: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "join_game",
			calldata: [gameId, playerName],
		};
	};

	const actions_joinGame = async (snAccount: Account | AccountInterface, gameId: BigNumberish, playerName: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_joinGame_calldata(gameId, playerName),
				"playerzero",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_nextRound_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "next_round",
			calldata: [gameId],
		};
	};

	const actions_nextRound = async (snAccount: Account | AccountInterface, gameId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_nextRound_calldata(gameId),
				"playerzero",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_sabotagePlayer_calldata = (gameId: BigNumberish, targetPlayer: string, asset: CairoCustomEnum): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "sabotage_player",
			calldata: [gameId, targetPlayer, asset],
		};
	};

	const actions_sabotagePlayer = async (snAccount: Account | AccountInterface, gameId: BigNumberish, targetPlayer: string, asset: CairoCustomEnum) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_sabotagePlayer_calldata(gameId, targetPlayer, asset),
				"playerzero",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_sellAsset_calldata = (gameId: BigNumberish, asset: CairoCustomEnum): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "sell_asset",
			calldata: [gameId, asset],
		};
	};

	const actions_sellAsset = async (snAccount: Account | AccountInterface, gameId: BigNumberish, asset: CairoCustomEnum) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_sellAsset_calldata(gameId, asset),
				"playerzero",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_startGame_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "start_game",
			calldata: [gameId],
		};
	};

	const actions_startGame = async (snAccount: Account | AccountInterface, gameId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_startGame_calldata(gameId),
				"playerzero",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};



	return {
		actions: {
			burnAsset: actions_burnAsset,
			buildBurnAssetCalldata: build_actions_burnAsset_calldata,
			buyAsset: actions_buyAsset,
			buildBuyAssetCalldata: build_actions_buyAsset_calldata,
			createGame: actions_createGame,
			buildCreateGameCalldata: build_actions_createGame_calldata,
			joinGame: actions_joinGame,
			buildJoinGameCalldata: build_actions_joinGame_calldata,
			nextRound: actions_nextRound,
			buildNextRoundCalldata: build_actions_nextRound_calldata,
			sabotagePlayer: actions_sabotagePlayer,
			buildSabotagePlayerCalldata: build_actions_sabotagePlayer_calldata,
			sellAsset: actions_sellAsset,
			buildSellAssetCalldata: build_actions_sellAsset_calldata,
			startGame: actions_startGame,
			buildStartGameCalldata: build_actions_startGame_calldata,
		},
	};
}