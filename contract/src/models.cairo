use starknet::{ContractAddress};

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct Player {
    #[key]
    pub address: ContractAddress,
    pub name: felt252,
    pub token_balance: u128,
}

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct Inventory {
    #[key]
    pub player: ContractAddress,
    pub gold: u8,
    pub water: u8,
    pub oil: u8,
}

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct Game {
    #[key]
    pub id: felt252,
    pub round: u8,
    pub is_active: bool,
    pub max_rounds: u8,
    pub num_players: u8,
}

#[derive(Copy, Drop, Serde, Debug, Introspect)]
pub struct AssetStats {
    pub bought: u8,
    pub sold: u8,
    pub burned: u8,
    pub sabotaged: u8,
}

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct Market {
    #[key]
    pub game_id: felt252,
    pub gold_price: u128,
    pub water_price: u128,
    pub oil_price: u128,
    pub volatility_seed: felt252,
    // Round statistics
    pub gold_stats: AssetStats,
    pub water_stats: AssetStats,
    pub oil_stats: AssetStats,
}

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct Action {
    #[key]
    pub player_id: ContractAddress,
    #[key]
    pub timestamp: u64,
    pub action_type: ActionType,
    pub asset: AssetType,
    pub target_player: Option<ContractAddress>,
    pub round: u8,
}

#[derive(Serde, Copy, Drop, Introspect, PartialEq, Debug)]
pub enum ActionType {
    Buy,
    Sell,
    Burn,
    Sabotage,
}

#[derive(Serde, Copy, Drop, Introspect, PartialEq, Debug)]
pub enum AssetType {
    Gold,
    Water,
    Oil,
}

// Conversion traits for storage
impl ActionTypeIntoFelt252 of Into<ActionType, felt252> {
    fn into(self: ActionType) -> felt252 {
        match self {
            ActionType::Buy => 1,
            ActionType::Sell => 2,
            ActionType::Burn => 3,
            ActionType::Sabotage => 4,
        }
    }
}

impl AssetTypeIntoFelt252 of Into<AssetType, felt252> {
    fn into(self: AssetType) -> felt252 {
        match self {
            AssetType::Gold => 1,
            AssetType::Water => 2,
            AssetType::Oil => 3,
        }
    }
}

impl OptionContractAddressIntoFelt252 of Into<Option<ContractAddress>, felt252> {
    fn into(self: Option<ContractAddress>) -> felt252 {
        match self {
            Option::None => 0,
            Option::Some(addr) => addr.into(),
        }
    }
}

// Helper traits for market operations
#[generate_trait]
pub impl MarketImpl of MarketTrait {
    fn get_asset_price(self: Market, asset: AssetType) -> u128 {
        match asset {
            AssetType::Gold => self.gold_price,
            AssetType::Water => self.water_price,
            AssetType::Oil => self.oil_price,
        }
    }

    fn set_asset_price(ref self: Market, asset: AssetType, price: u128) {
        match asset {
            AssetType::Gold => self.gold_price = price,
            AssetType::Water => self.water_price = price,
            AssetType::Oil => self.oil_price = price,
        }
    }

    fn get_asset_stats(self: Market, asset: AssetType) -> AssetStats {
        match asset {
            AssetType::Gold => self.gold_stats,
            AssetType::Water => self.water_stats,
            AssetType::Oil => self.oil_stats,
        }
    }

    fn set_asset_stats(ref self: Market, asset: AssetType, stats: AssetStats) {
        match asset {
            AssetType::Gold => self.gold_stats = stats,
            AssetType::Water => self.water_stats = stats,
            AssetType::Oil => self.oil_stats = stats,
        }
    }

    fn increment_action_stat(ref self: Market, asset: AssetType, action: ActionType) {
        let mut stats = self.get_asset_stats(asset);
        match action {
            ActionType::Buy => stats.bought += 1,
            ActionType::Sell => stats.sold += 1,
            ActionType::Burn => stats.burned += 1,
            ActionType::Sabotage => stats.sabotaged += 1,
        }
        self.set_asset_stats(asset, stats);
    }

    fn reset_round_stats(ref self: Market) {
        let empty_stats = AssetStats { bought: 0, sold: 0, burned: 0, sabotaged: 0 };
        self.gold_stats = empty_stats;
        self.water_stats = empty_stats;
        self.oil_stats = empty_stats;
    }
}

#[generate_trait]
pub impl InventoryImpl of InventoryTrait {
    fn get_asset_amount(self: Inventory, asset: AssetType) -> u8 {
        match asset {
            AssetType::Gold => self.gold,
            AssetType::Water => self.water,
            AssetType::Oil => self.oil,
        }
    }

    fn set_asset_amount(ref self: Inventory, asset: AssetType, amount: u8) {
        match asset {
            AssetType::Gold => self.gold = amount,
            AssetType::Water => self.water = amount,
            AssetType::Oil => self.oil = amount,
        }
    }

    fn has_asset(self: Inventory, asset: AssetType) -> bool {
        self.get_asset_amount(asset) > 0
    }

    fn total_assets(self: Inventory) -> u16 {
        (self.gold + self.water + self.oil).into()
    }
}

#[cfg(test)]
mod tests {
    use super::{Inventory, InventoryTrait, AssetType, Market, MarketTrait, ActionType, AssetStats};
    use starknet::contract_address_const;

    #[test]
    fn test_inventory_has_asset() {
        let inventory = Inventory {
            player: contract_address_const::<0x1>(),
            gold: 5,
            water: 0,
            oil: 3,
        };
        
        assert(inventory.has_asset(AssetType::Gold), 'should have gold');
        assert(!inventory.has_asset(AssetType::Water), 'should not have water');
        assert(inventory.has_asset(AssetType::Oil), 'should have oil');
    }

    #[test]
    fn test_inventory_total_assets() {
        let inventory = Inventory {
            player: contract_address_const::<0x1>(),
            gold: 5,
            water: 2,
            oil: 3,
        };
        
        assert(inventory.total_assets() == 10, 'total should be 10');
    }

    #[test]
    fn test_market_asset_price() {
        let empty_stats = AssetStats { bought: 0, sold: 0, burned: 0, sabotaged: 0 };
        let market = Market {
            game_id: 1,
            gold_price: 100,
            water_price: 50,
            oil_price: 200,
            volatility_seed: 12345,
            gold_stats: empty_stats,
            water_stats: empty_stats,
            oil_stats: empty_stats,
        };
        
        assert(market.get_asset_price(AssetType::Gold) == 100, 'gold price wrong');
        assert(market.get_asset_price(AssetType::Water) == 50, 'water price wrong');
        assert(market.get_asset_price(AssetType::Oil) == 200, 'oil price wrong');
    }

    #[test]
    fn test_market_stats_tracking() {
        let empty_stats = AssetStats { bought: 0, sold: 0, burned: 0, sabotaged: 0 };
        let mut market = Market {
            game_id: 1,
            gold_price: 100,
            water_price: 50,
            oil_price: 200,
            volatility_seed: 12345,
            gold_stats: empty_stats,
            water_stats: empty_stats,
            oil_stats: empty_stats,
        };
        
        market.increment_action_stat(AssetType::Gold, ActionType::Buy);
        market.increment_action_stat(AssetType::Gold, ActionType::Burn);
        
        let gold_stats = market.get_asset_stats(AssetType::Gold);
        assert(gold_stats.bought == 1, 'bought should be 1');
        assert(gold_stats.burned == 1, 'burned should be 1');
        assert(gold_stats.sold == 0, 'sold should be 0');
    }
}