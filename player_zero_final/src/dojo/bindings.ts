import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { CairoCustomEnum, CairoOption, CairoOptionVariant, BigNumberish } from 'starknet';

// Type definition for `playerzero::models::Action` struct
export interface Action {
	player_id: string;
	timestamp: BigNumberish;
	action_type: ActionTypeEnum;
	asset: AssetTypeEnum;
	target_player: CairoOption<string>;
	round: BigNumberish;
}

// Type definition for `playerzero::models::ActionValue` struct
export interface ActionValue {
	action_type: ActionTypeEnum;
	asset: AssetTypeEnum;
	target_player: CairoOption<string>;
	round: BigNumberish;
}

// Type definition for `playerzero::models::AssetStats` struct
export interface AssetStats {
	bought: BigNumberish;
	sold: BigNumberish;
	burned: BigNumberish;
	sabotaged: BigNumberish;
}

// Type definition for `playerzero::models::Game` struct
export interface Game {
	id: string;
	round: BigNumberish;
	is_active: boolean;
	max_rounds: BigNumberish;
	num_players: BigNumberish;
}

// Type definition for `playerzero::models::GameValue` struct
export interface GameValue {
	round: BigNumberish;
	is_active: boolean;
	max_rounds: BigNumberish;
	num_players: BigNumberish;
}

// Type definition for `playerzero::models::Inventory` struct
export interface Inventory {
	player: string;
	gold: BigNumberish;
	water: BigNumberish;
	oil: BigNumberish;
}

// Type definition for `playerzero::models::InventoryValue` struct
export interface InventoryValue {
	gold: BigNumberish;
	water: BigNumberish;
	oil: BigNumberish;
}

// Type definition for `playerzero::models::Market` struct
export interface Market {
	game_id: BigNumberish;
	gold_price: BigNumberish;
	water_price: BigNumberish;
	oil_price: BigNumberish;
	volatility_seed: BigNumberish;
	gold_stats: AssetStats;
	water_stats: AssetStats;
	oil_stats: AssetStats;
}

// Type definition for `playerzero::models::MarketValue` struct
export interface MarketValue {
	gold_price: BigNumberish;
	water_price: BigNumberish;
	oil_price: BigNumberish;
	volatility_seed: BigNumberish;
	gold_stats: AssetStats;
	water_stats: AssetStats;
	oil_stats: AssetStats;
}

// Type definition for `playerzero::models::Player` struct
export interface Player {
	address: string;
	name: BigNumberish;
	token_balance: BigNumberish;
}

// Type definition for `playerzero::models::PlayerValue` struct
export interface PlayerValue {
	name: BigNumberish;
	token_balance: BigNumberish;
}

// Type definition for `playerzero::systems::actions::actions::ActionExecuted` struct
export interface ActionExecuted {
	player: string;
	action_type: ActionTypeEnum;
	asset: AssetTypeEnum;
	game_id: BigNumberish;
	round: BigNumberish;
}

// Type definition for `playerzero::systems::actions::actions::ActionExecutedValue` struct
export interface ActionExecutedValue {
	action_type: ActionTypeEnum;
	asset: AssetTypeEnum;
	game_id: BigNumberish;
	round: BigNumberish;
}

// Type definition for `playerzero::systems::actions::actions::AssetBurned` struct
export interface AssetBurned {
	player: string;
	asset: AssetTypeEnum;
	new_price: BigNumberish;
	game_id: BigNumberish;
}

// Type definition for `playerzero::systems::actions::actions::AssetBurnedValue` struct
export interface AssetBurnedValue {
	asset: AssetTypeEnum;
	new_price: BigNumberish;
	game_id: BigNumberish;
}

// Type definition for `playerzero::systems::actions::actions::GameEnded` struct
export interface GameEnded {
	game_id: BigNumberish;
	final_round: BigNumberish;
}

// Type definition for `playerzero::systems::actions::actions::GameEndedValue` struct
export interface GameEndedValue {
	final_round: BigNumberish;
}

// Type definition for `playerzero::systems::actions::actions::GameStarted` struct
export interface GameStarted {
	game_id: BigNumberish;
	num_players: BigNumberish;
	start_time: BigNumberish;
}

// Type definition for `playerzero::systems::actions::actions::GameStartedValue` struct
export interface GameStartedValue {
	num_players: BigNumberish;
	start_time: BigNumberish;
}

// Type definition for `playerzero::systems::actions::actions::PlayerJoined` struct
export interface PlayerJoined {
	player: string;
	game_id: BigNumberish;
	name: BigNumberish;
}

// Type definition for `playerzero::systems::actions::actions::PlayerJoinedValue` struct
export interface PlayerJoinedValue {
	game_id: BigNumberish;
	name: BigNumberish;
}

// Type definition for `playerzero::systems::actions::actions::SabotageSuccess` struct
export interface SabotageSuccess {
	attacker: string;
	target: string;
	asset: AssetTypeEnum;
	game_id: BigNumberish;
}

// Type definition for `playerzero::systems::actions::actions::SabotageSuccessValue` struct
export interface SabotageSuccessValue {
	target: string;
	asset: AssetTypeEnum;
	game_id: BigNumberish;
}

// Type definition for `playerzero::models::ActionType` enum
export const actionType = [
	'Buy',
	'Sell',
	'Burn',
	'Sabotage',
] as const;
export type ActionType = { [key in typeof actionType[number]]: string };
export type ActionTypeEnum = CairoCustomEnum;

// Type definition for `playerzero::models::AssetType` enum
export const assetType = [
	'Gold',
	'Water',
	'Oil',
] as const;
export type AssetType = { [key in typeof assetType[number]]: string };
export type AssetTypeEnum = CairoCustomEnum;

export interface SchemaType extends ISchemaType {
	playerzero: {
		Action: Action,
		ActionValue: ActionValue,
		AssetStats: AssetStats,
		Game: Game,
		GameValue: GameValue,
		Inventory: Inventory,
		InventoryValue: InventoryValue,
		Market: Market,
		MarketValue: MarketValue,
		Player: Player,
		PlayerValue: PlayerValue,
		ActionExecuted: ActionExecuted,
		ActionExecutedValue: ActionExecutedValue,
		AssetBurned: AssetBurned,
		AssetBurnedValue: AssetBurnedValue,
		GameEnded: GameEnded,
		GameEndedValue: GameEndedValue,
		GameStarted: GameStarted,
		GameStartedValue: GameStartedValue,
		PlayerJoined: PlayerJoined,
		PlayerJoinedValue: PlayerJoinedValue,
		SabotageSuccess: SabotageSuccess,
		SabotageSuccessValue: SabotageSuccessValue,
	},
}
export const schema: SchemaType = {
	playerzero: {
		Action: {
			player_id: "",
			timestamp: 0,
		action_type: new CairoCustomEnum({ 
					Buy: "",
				Sell: undefined,
				Burn: undefined,
				Sabotage: undefined, }),
		asset: new CairoCustomEnum({ 
					Gold: "",
				Water: undefined,
				Oil: undefined, }),
		target_player: new CairoOption(CairoOptionVariant.None),
			round: 0,
		},
		ActionValue: {
		action_type: new CairoCustomEnum({ 
					Buy: "",
				Sell: undefined,
				Burn: undefined,
				Sabotage: undefined, }),
		asset: new CairoCustomEnum({ 
					Gold: "",
				Water: undefined,
				Oil: undefined, }),
		target_player: new CairoOption(CairoOptionVariant.None),
			round: 0,
		},
		AssetStats: {
			bought: 0,
			sold: 0,
			burned: 0,
			sabotaged: 0,
		},
		Game: {
			id: "0",
			round: 0,
			is_active: false,
			max_rounds: 0,
			num_players: 0,
		},
		GameValue: {
			round: 0,
			is_active: false,
			max_rounds: 0,
			num_players: 0,
		},
		Inventory: {
			player: "",
			gold: 0,
			water: 0,
			oil: 0,
		},
		InventoryValue: {
			gold: 0,
			water: 0,
			oil: 0,
		},
		Market: {
			game_id: 0,
			gold_price: 0,
			water_price: 0,
			oil_price: 0,
			volatility_seed: 0,
		gold_stats: { bought: 0, sold: 0, burned: 0, sabotaged: 0, },
		water_stats: { bought: 0, sold: 0, burned: 0, sabotaged: 0, },
		oil_stats: { bought: 0, sold: 0, burned: 0, sabotaged: 0, },
		},
		MarketValue: {
			gold_price: 0,
			water_price: 0,
			oil_price: 0,
			volatility_seed: 0,
		gold_stats: { bought: 0, sold: 0, burned: 0, sabotaged: 0, },
		water_stats: { bought: 0, sold: 0, burned: 0, sabotaged: 0, },
		oil_stats: { bought: 0, sold: 0, burned: 0, sabotaged: 0, },
		},
		Player: {
			address: "",
			name: 0,
			token_balance: 0,
		},
		PlayerValue: {
			name: 0,
			token_balance: 0,
		},
		ActionExecuted: {
			player: "",
		action_type: new CairoCustomEnum({ 
					Buy: "",
				Sell: undefined,
				Burn: undefined,
				Sabotage: undefined, }),
		asset: new CairoCustomEnum({ 
					Gold: "",
				Water: undefined,
				Oil: undefined, }),
			game_id: 0,
			round: 0,
		},
		ActionExecutedValue: {
		action_type: new CairoCustomEnum({ 
					Buy: "",
				Sell: undefined,
				Burn: undefined,
				Sabotage: undefined, }),
		asset: new CairoCustomEnum({ 
					Gold: "",
				Water: undefined,
				Oil: undefined, }),
			game_id: 0,
			round: 0,
		},
		AssetBurned: {
			player: "",
		asset: new CairoCustomEnum({ 
					Gold: "",
				Water: undefined,
				Oil: undefined, }),
			new_price: 0,
			game_id: 0,
		},
		AssetBurnedValue: {
		asset: new CairoCustomEnum({ 
					Gold: "",
				Water: undefined,
				Oil: undefined, }),
			new_price: 0,
			game_id: 0,
		},
		GameEnded: {
			game_id: 0,
			final_round: 0,
		},
		GameEndedValue: {
			final_round: 0,
		},
		GameStarted: {
			game_id: 0,
			num_players: 0,
			start_time: 0,
		},
		GameStartedValue: {
			num_players: 0,
			start_time: 0,
		},
		PlayerJoined: {
			player: "",
			game_id: 0,
			name: 0,
		},
		PlayerJoinedValue: {
			game_id: 0,
			name: 0,
		},
		SabotageSuccess: {
			attacker: "",
			target: "",
		asset: new CairoCustomEnum({ 
					Gold: "",
				Water: undefined,
				Oil: undefined, }),
			game_id: 0,
		},
		SabotageSuccessValue: {
			target: "",
		asset: new CairoCustomEnum({ 
					Gold: "",
				Water: undefined,
				Oil: undefined, }),
			game_id: 0,
		},
	},
};
export enum ModelsMapping {
	Action = 'playerzero-Action',
	ActionType = 'playerzero-ActionType',
	ActionValue = 'playerzero-ActionValue',
	AssetStats = 'playerzero-AssetStats',
	AssetType = 'playerzero-AssetType',
	Game = 'playerzero-Game',
	GameValue = 'playerzero-GameValue',
	Inventory = 'playerzero-Inventory',
	InventoryValue = 'playerzero-InventoryValue',
	Market = 'playerzero-Market',
	MarketValue = 'playerzero-MarketValue',
	Player = 'playerzero-Player',
	PlayerValue = 'playerzero-PlayerValue',
	ActionExecuted = 'playerzero-ActionExecuted',
	ActionExecutedValue = 'playerzero-ActionExecutedValue',
	AssetBurned = 'playerzero-AssetBurned',
	AssetBurnedValue = 'playerzero-AssetBurnedValue',
	GameEnded = 'playerzero-GameEnded',
	GameEndedValue = 'playerzero-GameEndedValue',
	GameStarted = 'playerzero-GameStarted',
	GameStartedValue = 'playerzero-GameStartedValue',
	PlayerJoined = 'playerzero-PlayerJoined',
	PlayerJoinedValue = 'playerzero-PlayerJoinedValue',
	SabotageSuccess = 'playerzero-SabotageSuccess',
	SabotageSuccessValue = 'playerzero-SabotageSuccessValue',
}