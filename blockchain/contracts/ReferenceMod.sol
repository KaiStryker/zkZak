// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

import {FollowerOnlyReferenceModule} from "./Lens/modules/reference/FollowerOnlyReferenceModule.sol";

contract ReferenceMod is FollowerOnlyReferenceModule{
    constructor(address hub) FollowerOnlyReferenceModule(hub){}
}