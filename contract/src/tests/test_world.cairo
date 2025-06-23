#[cfg(test)]
mod tests {
    use dojo_cairo_test::WorldStorageTestTrait;
    use dojo::model::{ModelStorage, ModelStorageTest};
    use dojo::world::WorldStorageTrait;
    use dojo_cairo_test::{
        spawn_test_world, NamespaceDef, TestResource, ContractDefTrait, ContractDef,
    };
    use playerzero::systems::actions::{actions, IActionsDispatcher, IActionsDispatcherTrait};
    use playerzero::models::{
        Game, m_Game, Player, m_Player, Inventory, m_Inventory, 
        Market, m_Market, Action, m_Action, AssetType, InventoryTrait, MarketTrait, ActionType
    };
 

    fn namespace_def() -> NamespaceDef {
        let ndef = NamespaceDef {
            namespace: "playerzero",
            resources: [
                TestResource::Model(m_Game::TEST_CLASS_HASH),
                TestResource::Model(m_Player::TEST_CLASS_HASH),
                TestResource::Model(m_Inventory::TEST_CLASS_HASH),
                TestResource::Model(m_Market::TEST_CLASS_HASH),
                TestResource::Model(m_Action::TEST_CLASS_HASH),
                TestResource::Event(actions::e_PlayerJoined::TEST_CLASS_HASH),
                TestResource::Event(actions::e_GameStarted::TEST_CLASS_HASH),
                TestResource::Event(actions::e_ActionExecuted::TEST_CLASS_HASH),
                TestResource::Event(actions::e_AssetBurned::TEST_CLASS_HASH),
                TestResource::Event(actions::e_SabotageSuccess::TEST_CLASS_HASH),
                TestResource::Event(actions::e_GameEnded::TEST_CLASS_HASH),
                TestResource::Contract(actions::TEST_CLASS_HASH),
            ].span(),
        };
        ndef
    }

    fn contract_defs() -> Span<ContractDef> {
        [
            ContractDefTrait::new(@"playerzero", @"actions")
                .with_writer_of([dojo::utils::bytearray_hash(@"playerzero")].span())
        ].span()
    }

    // #[test]
    // fn test_create_game() {
    //     let ndef = namespace_def();
    //     let mut world = spawn_test_world([ndef].span());
    //     world.sync_perms_and_inits(contract_defs());

    //     let (contract_address, _) = world.dns(@"actions").unwrap();
    //     let actions_system = IActionsDispatcher { contract_address };

    //     starknet::testing::set_block_timestamp(1000);
    //     let game_id = actions_system.create_game(20);
        
    //     let game: Game = world.read_model(game_id);
    //     assert(game.id == 1000, 'Game ID should match timestamp');
    //     assert(game.round == 0, 'Initial round should be 0');
    //     assert(game.is_active, 'Game should be active');
    //     assert(game.max_rounds == 20, 'Max rounds should be 20');
    //     assert(game.num_players == 0, 'Should start with 0 players');

    //     // Verify market is created with initial prices
    //     let market: Market = world.read_model(game_id);
    //     assert(market.game_id == game_id, 'Market game_id incorrect');
    //     assert(market.gold_price == 100, 'Gold price should be 100');
    //     assert(market.water_price == 50, 'Water price should be 50');
    //     assert(market.data_price == 150, 'Data price should be 150');
    // }

    // #[test]
    // #[available_gas(90000000)]
    // fn test_join_game_creates_player_and_inventory() {
    //     let player1 = starknet::contract_address_const::<0x0>();
    //     let ndef = namespace_def();
    //     let mut world = spawn_test_world([ndef].span());
    //     world.sync_perms_and_inits(contract_defs());

    //     let (contract_address, _) = world.dns(@"actions").unwrap();
    //     let actions_system = IActionsDispatcher { contract_address };

    //     starknet::testing::set_block_timestamp(1000);
    //     let game_id = actions_system.create_game(20);

    //     starknet::testing::set_caller_address(player1);
    //     actions_system.join_game(game_id, 'Alice');

    //     // Verify player model
    //     let player: Player = world.read_model(player1);
    //     assert(player.address == player1, 'Player address incorrect'); 
    //     assert(player.token_balance == 1000, 'Initial balance incorrect');

    //     // Verify inventory model - should start empty
    //     let inventory: Inventory = world.read_model(player1);
    //     assert(inventory.player == player1, 'Inventory player incorrect');
    //     assert(inventory.gold == 0, 'Should start with 0 gold');
    //     assert(inventory.water == 0, 'Should start with 0 water');
    //     assert(inventory.data == 0, 'Should start with 0 data');

    //     // Verify game player count updated
    //     let game: Game = world.read_model(game_id);
    //     assert(game.num_players == 1, 'Should have 1 player');
    // }

    #[test]
    #[available_gas(90000000)]
    fn test_multiple_players_join() {
        let player1 = starknet::contract_address_const::<0x0>();
        let player2 = starknet::contract_address_const::<0x2>();
        let ndef = namespace_def();
        let mut world = spawn_test_world([ndef].span());
        world.sync_perms_and_inits(contract_defs());

        let (contract_address, _) = world.dns(@"actions").unwrap();
        let actions_system = IActionsDispatcher { contract_address };

        starknet::testing::set_block_timestamp(1000);
        let game_id = actions_system.create_game(20);

        // First player joins
        starknet::testing::set_caller_address(player1);
        actions_system.join_game(game_id, 'Alice');

        // Second player joins
        starknet::testing::set_caller_address(player2);
        actions_system.join_game(game_id, 'Bob');

        let game: Game = world.read_model(game_id);
        assert(game.num_players == 2, 'Should have 2 players');

        // Verify both players exist
        let player1_data: Player = world.read_model(player1);
        let player2_data: Player = world.read_model(player2);
        assert(player1_data.address == player1, 'Player 1 name incorrect');
        assert(player2_data.address == player2, 'Player 2 name incorrect');
    }

    // #[test]
    // #[available_gas(90000000)]
    // fn test_start_game_success() {
    //     let player1 = starknet::contract_address_const::<0x0>();
    //     let ndef = namespace_def();
    //     let mut world = spawn_test_world([ndef].span());
    //     world.sync_perms_and_inits(contract_defs());

    //     let (contract_address, _) = world.dns(@"actions").unwrap();
    //     let actions_system = IActionsDispatcher { contract_address };

    //     starknet::testing::set_block_timestamp(1000);
    //     let game_id = actions_system.create_game(20);

    //     starknet::testing::set_caller_address(player1);
    //     actions_system.join_game(game_id, 'Alice');

    //     starknet::testing::set_block_timestamp(2000);
    //     actions_system.start_game(game_id);

    //     let game: Game = world.read_model(game_id);
    //     assert(game.is_active, 'Game should be active');
    //     assert(game.round == 1, 'Round should be 1');
    // }

    // #[test]
    // #[available_gas(90000000)]
    // #[should_panic(expected: ('Need at least 1 player',))]
    // fn test_start_game_no_players() {
    //     let ndef = namespace_def();
    //     let mut world = spawn_test_world([ndef].span());
    //     world.sync_perms_and_inits(contract_defs());

    //     let (contract_address, _) = world.dns(@"actions").unwrap();
    //     let actions_system = IActionsDispatcher { contract_address };

    //     starknet::testing::set_block_timestamp(1000);
    //     let game_id = actions_system.create_game(20);

    //     // Try to start without any players
    //     actions_system.start_game(game_id);
    // }

    // #[test]
    // #[available_gas(90000000)]
    // fn test_join_game_before_start() {
    //     let player1 = starknet::contract_address_const::<0x0>();
    //     let player2 = starknet::contract_address_const::<0x2>();
    //     let ndef = namespace_def();
    //     let mut world = spawn_test_world([ndef].span());
    //     world.sync_perms_and_inits(contract_defs());

    //     let (contract_address, _) = world.dns(@"actions").unwrap();
    //     let actions_system = IActionsDispatcher { contract_address };

    //     starknet::testing::set_block_timestamp(1000);
    //     let game_id = actions_system.create_game(20);

    //     // Players can join before game starts (round == 0)
    //     starknet::testing::set_caller_address(player1);
    //     actions_system.join_game(game_id, 'Alice');

    //     starknet::testing::set_caller_address(player2);
    //     actions_system.join_game(game_id, 'Bob');

    //     let game: Game = world.read_model(game_id);
    //     assert(game.num_players == 2, 'Should have 2 players');
    //     assert(game.round == 0, 'Round should still be 0');
    // }

    // #[test]
    // #[available_gas(90000000)]
    // fn test_buy_asset_success() {
    //     let player1 = starknet::contract_address_const::<0x0>();
    //     let ndef = namespace_def();
    //     let mut world = spawn_test_world([ndef].span());
    //     world.sync_perms_and_inits(contract_defs());

    //     let (contract_address, _) = world.dns(@"actions").unwrap();
    //     let actions_system = IActionsDispatcher { contract_address };

    //     starknet::testing::set_block_timestamp(1000);
    //     let game_id = actions_system.create_game(20);

    //     starknet::testing::set_caller_address(player1);
    //     actions_system.join_game(game_id, 'Alice');
    //     actions_system.start_game(game_id);

    //     // Get initial state
    //     let market: Market = world.read_model(game_id);
    //     let gold_price = market.gold_price;

    //     // Buy gold asset
    //     actions_system.buy_asset(game_id, AssetType::Gold);

    //     // Verify inventory updated
    //     let inventory: Inventory = world.read_model(player1);
    //     assert(inventory.has_asset(AssetType::Gold), 'Should have 1 gold');

    //     // Verify token balance reduced
    //     let player: Player = world.read_model(player1);
    //     assert(player.token_balance == 1000 - gold_price, 'Token balance incorrect');

    //     // Verify action recorded
    //     let action: Action = world.read_model((player1, 1000));
    //     assert(action.action_type == ActionType::Buy, 'Action type incorrect');
    //     assert(action.asset == AssetType::Gold, 'Asset type incorrect');
    // }

    // #[test]
    // #[available_gas(90000000)]
    // #[should_panic(expected: ('Insufficient balance',))]
    // fn test_buy_asset_insufficient_balance() {
    //     let player1 = starknet::contract_address_const::<0x0>();
    //     let ndef = namespace_def();
    //     let mut world = spawn_test_world([ndef].span());
    //     world.sync_perms_and_inits(contract_defs());

    //     let (contract_address, _) = world.dns(@"actions").unwrap();
    //     let actions_system = IActionsDispatcher { contract_address };

    //     starknet::testing::set_block_timestamp(1000);
    //     let game_id = actions_system.create_game(20);

    //     starknet::testing::set_caller_address(player1);
    //     actions_system.join_game(game_id, 'Alice');
    //     actions_system.start_game(game_id);

    //     // Try to buy too many expensive assets
    //     let mut i :u8= 0;
    //     loop {
    //         if i >= 20 { // Safety limit
    //             break;
    //         }
    //         actions_system.buy_asset(game_id, AssetType::Data); // Most expensive at 150
    //         i += 1;
    //     }
    // }

    // #[test]
    // #[available_gas(90000000)]
    // fn test_sell_asset_success() {
    //     let player1 = starknet::contract_address_const::<0x0>();
    //     let ndef = namespace_def();
    //     let mut world = spawn_test_world([ndef].span());
    //     world.sync_perms_and_inits(contract_defs());

    //     let (contract_address, _) = world.dns(@"actions").unwrap();
    //     let actions_system = IActionsDispatcher { contract_address };

    //     starknet::testing::set_block_timestamp(1000);
    //     let game_id = actions_system.create_game(20);

    //     starknet::testing::set_caller_address(player1);
    //     actions_system.join_game(game_id, 'Alice');
    //     actions_system.start_game(game_id);

    //     // First buy an asset
    //     actions_system.buy_asset(game_id, AssetType::Gold);

    //     let player_before: Player = world.read_model(player1);
    //     let market: Market = world.read_model(game_id);

    //     // Then sell it
    //     starknet::testing::set_block_timestamp(1001);
    //     actions_system.sell_asset(game_id, AssetType::Gold);

    //     // Verify inventory updated
    //     let inventory: Inventory = world.read_model(player1);
    //     assert(inventory.gold == 0, 'Should have 0 gold');

    //     // Verify token balance increased
    //     let player_after: Player = world.read_model(player1);
    //     assert(player_after.token_balance == player_before.token_balance + market.gold_price, 'Token balance incorrect');
    // }

    // #[test]
    // #[available_gas(90000000)]
    // #[should_panic(expected: ('Player does not own asset',))]
    // fn test_sell_asset_not_owned() {
    //     let player1 = starknet::contract_address_const::<0x0>();
    //     let ndef = namespace_def();
    //     let mut world = spawn_test_world([ndef].span());
    //     world.sync_perms_and_inits(contract_defs());

    //     let (contract_address, _) = world.dns(@"actions").unwrap();
    //     let actions_system = IActionsDispatcher { contract_address };

    //     starknet::testing::set_block_timestamp(1000);
    //     let game_id = actions_system.create_game(20);

    //     starknet::testing::set_caller_address(player1);
    //     actions_system.join_game(game_id, 'Alice');
    //     actions_system.start_game(game_id);

    //     // Try to sell asset without owning it
    //     actions_system.sell_asset(game_id, AssetType::Gold);
    // }

    // #[test]
    // #[available_gas(90000000)]
    // fn test_burn_asset_success() {
    //     let player1 = starknet::contract_address_const::<0x0>();
    //     let ndef = namespace_def();
    //     let mut world = spawn_test_world([ndef].span());
    //     world.sync_perms_and_inits(contract_defs());

    //     let (contract_address, _) = world.dns(@"actions").unwrap();
    //     let actions_system = IActionsDispatcher { contract_address };

    //     starknet::testing::set_block_timestamp(1000);
    //     let game_id = actions_system.create_game(20);

    //     starknet::testing::set_caller_address(player1);
    //     actions_system.join_game(game_id, 'Alice');
    //     actions_system.start_game(game_id);

    //     // Buy and then burn asset
    //     actions_system.buy_asset(game_id, AssetType::Gold);
        
    //     starknet::testing::set_block_timestamp(1001);
    //     actions_system.burn_asset(game_id, AssetType::Gold);

    //     // Verify inventory updated
    //     let inventory: Inventory = world.read_model(player1);
    //     assert(inventory.gold == 0, 'Should have 0 gold after burn');

    //     // Verify market stats updated
    //     let market: Market = world.read_model(game_id);
    //     assert(market.gold_stats.burned == 1, 'Should have 1 burned');
    // }

    #[test]
    #[available_gas(90000000)]
    fn test_sabotage_player_success() {
        let player1 = starknet::contract_address_const::<0x0>();
        let player2 = starknet::contract_address_const::<0xdeadbeef>();

        let ndef = namespace_def();
        let mut world = spawn_test_world([ndef].span());
        world.sync_perms_and_inits(contract_defs());

        let (contract_address, _) = world.dns(@"actions").unwrap();
        let actions_system = IActionsDispatcher { contract_address };

        starknet::testing::set_block_timestamp(1000);
        let game_id = actions_system.create_game(20);

        // Both players join
        starknet::testing::set_caller_address(player1);
        actions_system.join_game(game_id, 'Alice');
        
        starknet::testing::set_caller_address(player2);
        actions_system.join_game(game_id, 'Bob');
        
        actions_system.start_game(game_id);

        // Player2 buys an asset
        actions_system.buy_asset(game_id, AssetType::Water);
        let inventory: Inventory = world.read_model(player1);
        assert(inventory.has_asset(AssetType::Water), 'Should have 1 water');

        // Player1 sabotages Player2
        starknet::testing::set_caller_address(player1);
        starknet::testing::set_block_timestamp(1001);
        actions_system.sabotage_player(game_id, player2, AssetType::Water);

        // Verify target's inventory updated
        let target_inventory: Inventory = world.read_model(player2);
        assert(target_inventory.water == 0, 'Target should lose water');

        // Verify market stats
        let market: Market = world.read_model(game_id);
        assert(market.water_stats.sabotaged == 1, 'Should have 1 sabotaged');
    }

    // #[test]
    // #[available_gas(90000000)]
    // #[should_panic(expected: ('Cannot sabotage yourself',))]
    // fn test_sabotage_self_fails() {
    //     let player1 = starknet::contract_address_const::<0x0>();
    //     let ndef = namespace_def();
    //     let mut world = spawn_test_world([ndef].span());
    //     world.sync_perms_and_inits(contract_defs());

    //     let (contract_address, _) = world.dns(@"actions").unwrap();
    //     let actions_system = IActionsDispatcher { contract_address };

    //     starknet::testing::set_block_timestamp(1000);
    //     let game_id = actions_system.create_game(20);

    //     starknet::testing::set_caller_address(player1);
    //     actions_system.join_game(game_id, 'Alice');
    //     actions_system.start_game(game_id);

    //     // Try to sabotage self
    //     actions_system.sabotage_player(game_id, player1, AssetType::Gold);
    // }

    // #[test]
    // #[available_gas(90000000)]
    // fn test_next_round_progression() {
    //     let player1 = starknet::contract_address_const::<0x0>();
    //     let ndef = namespace_def();
    //     let mut world = spawn_test_world([ndef].span());
    //     world.sync_perms_and_inits(contract_defs());

    //     let (contract_address, _) = world.dns(@"actions").unwrap();
    //     let actions_system = IActionsDispatcher { contract_address };

    //     starknet::testing::set_block_timestamp(1000);
    //     let game_id = actions_system.create_game(3); // Short game for testing

    //     starknet::testing::set_caller_address(player1);
    //     actions_system.join_game(game_id, 'Alice');
    //     actions_system.start_game(game_id);

    //     // Do some actions to affect market
    //     actions_system.buy_asset(game_id, AssetType::Gold);
    //     actions_system.burn_asset(game_id, AssetType::Gold);

    //     let market_before: Market = world.read_model(game_id);
    //     assert(market_before.gold_stats.bought == 1, 'Should have 1 bought');
    //     assert(market_before.gold_stats.burned == 1, 'Should have 1 burned');

    //     // Progress to next round
    //     actions_system.next_round(game_id);

    //     let game: Game = world.read_model(game_id);
    //     assert(game.round == 2, 'Should be round 2');

    //     // Market stats should be reset after round progression
    //     let market_after: Market = world.read_model(game_id);
    //     assert(market_after.gold_stats.bought == 0, 'Stats should reset');
    //     assert(market_after.gold_stats.burned == 0, 'Stats should reset');
    // }

    // #[test]
    // #[available_gas(90000000)]
    // fn test_game_ends_after_max_rounds() {
    //     let player1 = starknet::contract_address_const::<0x0>();
    //     let ndef = namespace_def();
    //     let mut world = spawn_test_world([ndef].span());
    //     world.sync_perms_and_inits(contract_defs());

    //     let (contract_address, _) = world.dns(@"actions").unwrap();
    //     let actions_system = IActionsDispatcher { contract_address };

    //     starknet::testing::set_block_timestamp(1000);
    //     let game_id = actions_system.create_game(2); // Only 2 rounds

    //     starknet::testing::set_caller_address(player1);
    //     actions_system.join_game(game_id, 'Alice');
    //     actions_system.start_game(game_id);

    //     // Progress through all rounds
    //     actions_system.next_round(game_id); // Round 2
    //     actions_system.next_round(game_id); // Round 3, should end game

    //     let game: Game = world.read_model(game_id);
    //     assert(!game.is_active, 'Game should be inactive');
    //     assert(game.round == 3, 'Should be round 3');
    // }

    // #[test]
    // #[available_gas(90000000)]
    // fn test_inventory_helper_functions() {
    //     let player1 = starknet::contract_address_const::<0x0>();
    //     let ndef = namespace_def();
    //     let mut world = spawn_test_world([ndef].span());
    //     world.sync_perms_and_inits(contract_defs());

    //     let (contract_address, _) = world.dns(@"actions").unwrap();
    //     let actions_system = IActionsDispatcher { contract_address };

    //     starknet::testing::set_block_timestamp(1000);
    //     let game_id = actions_system.create_game(20);

    //     starknet::testing::set_caller_address(player1);
    //     actions_system.join_game(game_id, 'Alice');
    //     actions_system.start_game(game_id);

    //     // Buy some assets
    //     actions_system.buy_asset(game_id, AssetType::Gold);
    //     actions_system.buy_asset(game_id, AssetType::Water);

    //     let inventory: Inventory = world.read_model(player1);
        
    //     // Test has_asset function
    //     assert(inventory.has_asset(AssetType::Gold), 'Should have gold');
    //     assert(inventory.has_asset(AssetType::Water), 'Should have water');
    //     assert(!inventory.has_asset(AssetType::Data), 'Should not have data');

    //     // Test total_assets function
    //     assert(inventory.total_assets() == 2, 'Should have 2 total assets');

    //     // Test get_asset_amount function
    //     assert(inventory.get_asset_amount(AssetType::Gold) == 1, 'Should have 1 gold');
    //     assert(inventory.get_asset_amount(AssetType::Water) == 1, 'Should have 1 water');
    //     assert(inventory.get_asset_amount(AssetType::Data) == 0, 'Should have 0 data');
    // }

    // #[test]
    // #[available_gas(100000000)]
    // fn test_complete_game_flow() {
    //     let player1 = starknet::contract_address_const::<0x0>();
    //     let player2 = starknet::contract_address_const::<0x2>();
    //     let ndef = namespace_def();
    //     let mut world = spawn_test_world([ndef].span());
    //     world.sync_perms_and_inits(contract_defs());

    //     let (contract_address, _) = world.dns(@"actions").unwrap();
    //     let actions_system = IActionsDispatcher { contract_address };

    //     // Create and setup game
    //     starknet::testing::set_block_timestamp(1000);
    //     let game_id = actions_system.create_game(3);

    //     starknet::testing::set_caller_address(player1);
    //     actions_system.join_game(game_id, 'Alice');

    //     starknet::testing::set_caller_address(player2);
    //     actions_system.join_game(game_id, 'Bob');

    //     actions_system.start_game(game_id);

    //     // Round 1: Trading activity
    //     starknet::testing::set_caller_address(player1);
    //     actions_system.buy_asset(game_id, AssetType::Gold);
    //     actions_system.buy_asset(game_id, AssetType::Water);

    //     starknet::testing::set_caller_address(player2);
    //     actions_system.buy_asset(game_id, AssetType::Data);

    //     // Sabotage and burn actions
    //     starknet::testing::set_caller_address(player1);
    //     starknet::testing::set_block_timestamp(1001);
    //     actions_system.sabotage_player(game_id, player2, AssetType::Data);
    //     actions_system.burn_asset(game_id, AssetType::Water);

    //     // Verify game state before round progression
    //     let game_mid: Game = world.read_model(game_id);
    //     assert(game_mid.round == 1, 'Should be round 1');
    //     assert(game_mid.is_active, 'Game should be active');

    //     // Progress rounds
    //     actions_system.next_round(game_id); // Round 2
    //     actions_system.next_round(game_id); // Round 3  
    //     actions_system.next_round(game_id); // Should end game

    //     // Verify final game state
    //     let game_final: Game = world.read_model(game_id);
    //     assert(!game_final.is_active, 'Game should be ended');
    //     assert(game_final.round == 4, 'Should be round 4');

    //     // Verify players still exist with their final states
    //     let player1_final: Player = world.read_model(player1);
    //     let player2_final: Player = world.read_model(player2);
    //     assert(player1_final.name == 'Alice', 'Player 1 name should persist');
    //     assert(player2_final.name == 'Bob', 'Player 2 name should persist');
    // }
}