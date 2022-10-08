// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

import {ProfileFollowModule} from "./Lens/modules/follow/ProfileFollowModule.sol";

contract FollowCreator is ProfileFollowModule {
    constructor(address hub) ProfileFollowModule(hub) {}
}