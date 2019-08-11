// import { walk } from "../../src/Walk";
import { TransformConfig } from "../../src/Config";
import { run } from "../../src/Run";

// const fileList = walk('tests/Corruption-of-Champions-master');
const fileList = ['tests/All/test.as'];

const config: TransformConfig = {
    removeExtends: ['BaseContent', 'Utils', 'NPCAwareContent', 'AbstractLakeContent', 'BazaarAbstractContent', 'AbstractBoatContent', 'AbstractFarmContent', 'TelAdreAbstractContent', 'Enum', 'DefaultDict'],

    ignoreClasses: [],

    ignoreInterfaceMethods: {
        TimeAwareInterface: ['timeChange', 'timeChangeLarge']
    },

    identiferToParamPairs: [
        { name: 'player', type: 'Player' },
        { name: 'monster', type: 'Monster' }
    ],
};

run(fileList, config);
