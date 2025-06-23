use core::poseidon::poseidon_hash_span;
use playerzero::models::{
    Action, ActionType, AssetType, Game, Inventory, InventoryTrait, Market, MarketTrait, Player, AssetStats,
};

#[starknet::interface]
pub trait IActions<T> {
    fn join_game(ref self: T, game_id: felt252, player_name: felt252);
    fn start_game(ref self: T, game_id: felt252);
    fn buy_asset(ref self: T, game_id: felt252, asset: AssetType);
    fn sell_asset(ref self: T, game_id: felt252, asset: AssetType);
    fn burn_asset(ref self: T, game_id: felt252, asset: AssetType);
    fn sabotage_player(
        ref self: T, game_id: felt252, target_player: starknet::ContractAddress, asset: AssetType,
    );
    fn next_round(ref self: T, game_id: felt252);
    fn create_game(ref self: T, max_rounds: u8) -> felt252;
}

// dojo decorator
#[dojo::contract]
pub mod actions {
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use super::{
        Action, ActionType, AssetType, Game, IActions, Inventory, InventoryTrait, Market,
        MarketTrait, Player, update_market_prices, AssetStats,
    };

    // Events
    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct PlayerJoined {
        #[key]
        pub player: ContractAddress,
        pub game_id: felt252,
        pub name: felt252,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct GameStarted {
        #[key]
        pub game_id: felt252,
        pub num_players: u8,
        pub start_time: u64,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct ActionExecuted {
        #[key]
        pub player: ContractAddress,
        pub action_type: ActionType,
        pub asset: AssetType,
        pub game_id: felt252,
        pub round: u8,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct AssetBurned {
        #[key]
        pub player: ContractAddress,
        pub asset: AssetType,
        pub new_price: u128,
        pub game_id: felt252,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct SabotageSuccess {
        #[key]
        pub attacker: ContractAddress,
        pub target: ContractAddress,
        pub asset: AssetType,
        pub game_id: felt252,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct GameEnded {
        #[key]
        pub game_id: felt252,
        pub final_round: u8,
    }

    #[abi(embed_v0)]
    impl ActionsImpl of IActions<ContractState> {
        fn create_game(ref self: ContractState, max_rounds: u8) -> felt252 {
            let mut world = self.world_default();
            let game_id = get_block_timestamp().into(); // Simple game ID generation

            let game = Game { id: game_id, round: 0, is_active: true, max_rounds, num_players: 0 };
            
            let empty_stats = AssetStats { bought: 0, sold: 0, burned: 0, sabotaged: 0 };
            let market = Market {
                game_id,
                gold_price: 100, // Starting prices
                water_price: 50,
                oil_price: 150,
                volatility_seed: game_id,
                gold_stats: empty_stats,
                water_stats: empty_stats,
                oil_stats: empty_stats,
            };

            world.write_model(@game);
            world.write_model(@market);

            game_id
        }

        fn start_game(ref self: ContractState, game_id: felt252) {
            let mut world = self.world_default();
            let mut game: Game = world.read_model(game_id);
             
            assert(game.num_players > 0, 'Need at least 1 player');
            
            game.round = 1;
            
            world.write_model(@game);
            
            world.emit_event(@GameStarted { 
                game_id, 
                num_players: game.num_players,
                start_time: get_block_timestamp(),
            });
        }
        
        fn join_game(ref self: ContractState, game_id: felt252, player_name: felt252) {
            let mut world = self.world_default();
            let player_address = get_caller_address();

            // Check if game exists and is active
            let mut game: Game = world.read_model(game_id);
            assert(game.is_active, 'Game is not active');

            // Create player
            let player = Player {
                address: player_address, name: player_name, token_balance: 1000 // Starting balance
            };

            // Create empty inventory
            let inventory = Inventory { player: player_address, gold: 0, water: 0, oil: 0 };

            // Update game player count
            game.num_players += 1;

            world.write_model(@player);
            world.write_model(@inventory);
            world.write_model(@game);

            world.emit_event(@PlayerJoined { player: player_address, game_id, name: player_name });
        }

        fn buy_asset(ref self: ContractState, game_id: felt252, asset: AssetType) {
            let mut world = self.world_default();
            let player_address = get_caller_address();

            let game: Game = world.read_model(game_id);
            assert(game.is_active, 'Game is not active');

            let mut market: Market = world.read_model(game_id);
            let mut player: Player = world.read_model(player_address);
            let mut inventory: Inventory = world.read_model(player_address);

            let asset_price = market.get_asset_price(asset);

            // Check if player has enough tokens
            assert(player.token_balance >= asset_price, 'Insufficient balance');

            // Deduct price from player balance
            player.token_balance -= asset_price;

            // Add asset to inventory
            let current_amount = inventory.get_asset_amount(asset);
            inventory.set_asset_amount(asset, current_amount + 1);

            // Track market stats
            market.increment_action_stat(asset, ActionType::Buy);

            // Record action
            let action = Action {
                player_id: player_address,
                timestamp: get_block_timestamp(),
                action_type: ActionType::Buy,
                asset,
                target_player: Option::None,
                round: game.round,
            };

            world.write_model(@player);
            world.write_model(@inventory);
            world.write_model(@market);
            world.write_model(@action);

            world
                .emit_event(
                    @ActionExecuted {
                        player: player_address,
                        action_type: ActionType::Buy,
                        asset,
                        game_id,
                        round: game.round,
                    },
                );
        }

        fn sell_asset(ref self: ContractState, game_id: felt252, asset: AssetType) {
            let mut world = self.world_default();
            let player_address = get_caller_address();

            let game: Game = world.read_model(game_id);
            assert(game.is_active, 'Game is not active');

            let mut market: Market = world.read_model(game_id);
            let mut player: Player = world.read_model(player_address);
            let mut inventory: Inventory = world.read_model(player_address);

            // Check if player owns the asset
            assert(inventory.has_asset(asset), 'Player does not own asset');

            let asset_price = market.get_asset_price(asset);

            // Add price to player balance
            player.token_balance += asset_price;

            // Remove asset from inventory
            let current_amount = inventory.get_asset_amount(asset);
            inventory.set_asset_amount(asset, current_amount - 1);

            // Track market stats
            market.increment_action_stat(asset, ActionType::Sell);

            // Record action
            let action = Action {
                player_id: player_address,
                timestamp: get_block_timestamp(),
                action_type: ActionType::Sell,
                asset,
                target_player: Option::None,
                round: game.round,
            };

            world.write_model(@player);
            world.write_model(@inventory);
            world.write_model(@market);
            world.write_model(@action);

            world
                .emit_event(
                    @ActionExecuted {
                        player: player_address,
                        action_type: ActionType::Sell,
                        asset,
                        game_id,
                        round: game.round,
                    },
                );
        }

        fn burn_asset(ref self: ContractState, game_id: felt252, asset: AssetType) {
            let mut world = self.world_default();
            let player_address = get_caller_address();

            let game: Game = world.read_model(game_id);
            assert(game.is_active, 'Game is not active');

            let mut market: Market = world.read_model(game_id);
            let mut inventory: Inventory = world.read_model(player_address);

            // Check if player owns the asset
            assert(inventory.has_asset(asset), 'Player does not own asset');

            // Remove asset from inventory
            let current_amount = inventory.get_asset_amount(asset);
            inventory.set_asset_amount(asset, current_amount - 1);

            // Track market stats
            market.increment_action_stat(asset, ActionType::Burn);

            // Record action
            let action = Action {
                player_id: player_address,
                timestamp: get_block_timestamp(),
                action_type: ActionType::Burn,
                asset,
                target_player: Option::None,
                round: game.round,
            };

            let new_price = market.get_asset_price(asset); // Price will be updated at round end

            world.write_model(@inventory);
            world.write_model(@market);
            world.write_model(@action);

            world.emit_event(@AssetBurned { player: player_address, asset, new_price, game_id });
        }

        fn sabotage_player(
            ref self: ContractState,
            game_id: felt252,
            target_player: ContractAddress,
            asset: AssetType,
        ) {
            let mut world = self.world_default();
            let player_address = get_caller_address();

            let game: Game = world.read_model(game_id);
            assert(game.is_active, 'Game is not active');
            assert(player_address != target_player, 'Cannot sabotage yourself');

            let mut market: Market = world.read_model(game_id);
            let mut target_inventory: Inventory = world.read_model(target_player);

           
            

            // Remove asset from target's inventory
            let current_amount = target_inventory.get_asset_amount(asset);

             // Check if target owns the asset
            assert(current_amount>0, 'Target does not own asset');


            target_inventory.set_asset_amount(asset, current_amount - 1);

            // Track market stats
            market.increment_action_stat(asset, ActionType::Sabotage);

            // Record action
            let action = Action {
                player_id: player_address,
                timestamp: get_block_timestamp(),
                action_type: ActionType::Sabotage,
                asset,
                target_player: Option::Some(target_player),
                round: game.round,
            };

            world.write_model(@target_inventory);
            world.write_model(@market);
            world.write_model(@action);

            world
                .emit_event(
                    @SabotageSuccess {
                        attacker: player_address, target: target_player, asset, game_id,
                    },
                );
        }

        fn next_round(ref self: ContractState, game_id: felt252) {
            let mut world = self.world_default();

            let mut game: Game = world.read_model(game_id);
            assert(game.is_active, 'Game is not active');

            // Update market prices based on round activity
            let mut market: Market = world.read_model(game_id);
            update_market_prices(ref market, game.num_players.into());
            world.write_model(@market);

            // Increment round
            game.round += 1;

            // Check if game should end
            if game.round > game.max_rounds {
                game.is_active = false;
                world.emit_event(@GameEnded { game_id, final_round: game.round - 1 });
            }

            world.write_model(@game);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Use the default namespace "economic_game".
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"playerzero")
        }
    }
}

// Market volatility function based on player actions
fn update_market_prices(ref market: Market, num_players: u64) {
    // Update each asset price based on game stats tracked in the market
    update_asset_price(ref market, AssetType::Gold, num_players);
    update_asset_price(ref market, AssetType::Water, num_players);
    update_asset_price(ref market, AssetType::Oil, num_players);
    // Reset round stats after updating prices
    market.reset_round_stats();
}

fn update_asset_price(ref market: Market, asset: AssetType, num_players: u64) {
    let current_price = market.get_asset_price(asset);
    
    // Fetch round stats
    let stats = market.get_asset_stats(asset);
    let bought = stats.bought;
    let burned = stats.burned;
    let sabotaged = stats.sabotaged;
    let sold = stats.sold;
    
    // Weights to control impact of different actions
    let burn_weight = 200; // 2.0 * 100 for fixed point math
    let sabotage_weight = 150; // 1.5 * 100
    let sell_weight = 120; // 1.2 * 100
    let buy_weight = 100; // 1.0 * 100
    
    // Calculate net pressure using fixed point arithmetic
    let positive_pressure = (bought.into() * buy_weight) 
        + (burned.into() * burn_weight) 
        + (sabotaged.into() * sabotage_weight);
    let negative_pressure = sold.into() * sell_weight;
    
    // Net pressure (can be negative)
    let net_pressure = if positive_pressure >= negative_pressure {
        positive_pressure - negative_pressure
    } else {
        0 // Prevent underflow, treat as zero pressure
    };
    
    // Volatility constant (k = 0.1 = 10/100 for fixed point)
    let k = 10;
    
    // Calculate adjustment factor: 1.0 + k * (net_pressure / num_players)
    // Using fixed point arithmetic where 100 = 1.0
    let pressure_per_player = if num_players > 0 {
        (net_pressure * k) / (num_players * 100) // Divide by 100 to normalize weights
    } else {
        0
    };
    
    let adjustment_factor = 100 + pressure_per_player; // 100 = 1.0 in fixed point
    
    // Calculate new price
    let new_price = (current_price * adjustment_factor.into()) / 100;
    
    // Clamp to min & max price range (1 to 1000)
    let clamped_price = if new_price < 1 {
        1
    } else if new_price > 1000 {
        1000
    } else {
        new_price
    };
    
    market.set_asset_price(asset, clamped_price);
}