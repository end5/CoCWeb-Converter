import { funcReplacer, escRegex, trimLeft, combineStrRegex } from './Utils';

type ReplaceFunc = (match: string, ...args: string[]) => string;

function check(searchValue: string | RegExp, strOrFunc: string | ReplaceFunc) {
    return (match: string, ...args: string[]) => {
        if (match.split('\n').length > 1)
            console.error('Warning: Large match\nSearch Value: ' + searchValue + '\n' + match);

        if (typeof strOrFunc === 'string')
            return strOrFunc;
        else if (typeof strOrFunc === 'function')
            return strOrFunc(match, ...args);
        return '';
    };
}

function replace(text: string, searchValue: string | RegExp, replaceValue: string | ReplaceFunc): string {
    return text.replace(searchValue, check(searchValue, replaceValue));
}

export function fixText(text: string): string {
    const lines = text.split('\n');

    let removeCurlyBraceOpen = 0;
    let removeCurlyBraceClose = 0;
    let timeAwareClass = false;
    let monster = false;
    let className: string | undefined;
    const flags: Set<string> = new Set();
    const scenes: Set<string> = new Set();
    let index = 0;
    while (index < lines.length) {
        // Remove - package ...
        if (lines[index].trimLeft().startsWith('package')) {
            if (!lines[index].includes('{'))
                removeCurlyBraceOpen++;
            removeCurlyBraceClose++;
            lines.splice(index, 1);
            continue;
        }

        // Remove - if package ... then {
        if (removeCurlyBraceOpen > 0 && lines[index].trimLeft().startsWith('{')) {
            lines.splice(index, 1);
            removeCurlyBraceOpen--;
            continue;
        }

        // Remove - import ...
        if (lines[index].trimLeft().startsWith('import')) {
            lines.splice(index, 1);
            continue;
        }

        if (lines[index].trimLeft().startsWith('public class')) {
            className = lines[index].match(/public class ([\w\d_]+)/)![1];
            if (className.endsWith('Scene'))
                className = className.substr(0, className.length - 5);

            if (/public class [\w\d_ ]+ extends Monster/.test(lines[index]))
                monster = true;

            if (/public class [\w\d_ ]+ implements TimeAwareInterface/.test(lines[index])) {
                lines[index] = lines[index].replace('public class', 'export class');
                lines[index] = lines[index].replace('TimeAwareInterface', 'ITimeAware');
                timeAwareClass = true;
            }
            else {
                if (!lines[index].includes('{'))
                    removeCurlyBraceOpen++;
                removeCurlyBraceClose++;
                lines.splice(index, 1);
                continue;
            }
        }

        if (timeAwareClass && lines[index].trimLeft().startsWith('//End of Interface Implementation')) {
            lines.splice(index, 1, '}');
            timeAwareClass = false;
        }

        if (lines[index].trimLeft().startsWith('//Implementation of ITimeAware')) {
            lines.splice(index, 0);
            continue;
        }

        if (lines[index].trimLeft().startsWith('trace '))
            lines[index] = lines[index].replace('trace ', '// trace ');

        if (lines[index].trimLeft().startsWith('override '))
            lines[index] = lines[index].replace('override ', '');

        if (lines[index].trimLeft().startsWith('internal '))
            lines[index] = lines[index].replace('internal ', 'private ');

        if (className && lines[index].trimLeft().startsWith('public function ' + className + 'Scene'))
            lines[index] = lines[index].replace('public function ' + className + 'Scene', 'public constructor');

        if (className && lines[index].trimLeft().startsWith('public function ' + className)) {
            if (monster) {
                lines.splice(index, 0, `export class ${className} extends Character {`);
                index++;
            }

            lines[index] = lines[index].replace('public function ' + className, 'public constructor');

            if (monster) {
                while (!lines[index].includes('{'))
                    index++;
                index++;
                lines.splice(index, 0, `super(CharacterType.${className});`);
                index++;
                monster = false;

                let tempIndex = index;
                while (!lines[tempIndex].includes('}'))
                    tempIndex++;
                lines[tempIndex] = lines[tempIndex] + '}';
            }
        }

        function fixNextScene(line: string): string {
            return funcReplacer(line, /function ([ \w]+)\s*\(/, /\)(?:(:\s*\w+))?/,
                (match, name, ...args) => {
                    const outType = args.pop();
                    let str = `function ${name}`;
                    // Function returns nothing
                    if (outType === undefined || /:\s*void/.test(outType)) {
                        scenes.add(name.trimLeft());
                        str += '(' + ['player: Character'].concat(args).join(', ') + ')';
                        str += ': NextScreenChoices';
                    }
                    else {
                        if (args === undefined)
                            str += `()${outType}`;
                        else
                            str += `(${args.join(', ')})${outType}`;
                    }
                    return str;
                }
            );
        }

        if (lines[index].trimLeft().startsWith('public function')) {
            lines[index] = fixNextScene(lines[index]);
            lines[index] = lines[index].replace('public function', 'export function');
        }

        if (lines[index].trimLeft().startsWith('protected function')) {
            lines[index] = fixNextScene(lines[index]);
            lines[index] = lines[index].replace('protected function', 'function');
        }

        if (lines[index].trimLeft().startsWith('private function')) {
            lines[index] = fixNextScene(lines[index]);
            lines[index] = lines[index].replace('private function', 'function');
        }

        if (lines[index].trimLeft().startsWith('public var'))
            lines[index] = lines[index].replace('public var', 'public');

        if (lines[index].trimLeft().startsWith('private var'))
            lines[index] = lines[index].replace('private var', 'private');

        index++;
    }

    text = lines.join('\n');

    index = text.length - 1;
    while (removeCurlyBraceClose > 0) {
        if (text[index] === '}') {
            text = text.slice(0, index) + text.substr(index + 1);
            removeCurlyBraceClose--;
        }
        index--;
    }

    for (const scene of scenes) {
        text = funcReplacer(text, new RegExp(/(\w*)([ \t]*)/.source + escRegex(scene + '(').source), ')',
            (match, prev, space, ...args) => {
                if (prev !== 'function' && !prev.includes('.')) {
                    // console.log(`scene ${scene}\n\tp1 ${p1}\n\tp2 ${p2}\n\tp3 ${p3}\n`);
                    if (args !== undefined)
                        return prev + space + 'return ' + scene + '(player, ' + args.join(', ') + ')';
                    else
                        return prev + space + 'return ' + scene + '(player)';
                }
                else
                    return match;
            }
        );
    }

    text = replace(text, 'extends NPCAwareContent ', '');
    text = replace(text, 'extends BaseContent ', '');
    text = replace(text, 'TimeAwareInterface', 'ITimeAware');

    text = replace(text, /:\s*Function/g, ': ClickFunction');
    text = replace(text, /:\s*Boolean/g, ': boolean');
    text = replace(text, /:\s*Number/g, ': number');
    text = replace(text, /:\s*int/g, ': number');
    text = replace(text, /:\s*String/g, ': string');
    text = replace(text, /:\s*void/g, ': void');
    text = replace(text, /null/g, 'undefined');

    if (/flags\[kFLAGS\.([^\]]+)\]/g.test(text)) {
        text = replace(text, /flags\[kFLAGS\.([^\]]+)\]/g, (match, p1) => {
            flags.add(p1);
            return `${className}Flags.${p1}`;
        });
    }

    if (flags.size > 0) {
        let flagText = `export const ${className}Flags = Flags.register("${className}", {\n`;
        for (const flag of flags.values()) {
            flagText += `${flag}: 0,\n`;
        }
        flagText += '});\n';

        text = flagText + text;
    }
    // flagText += 'const player = CharDict.player;';

    text = funcReplacer(text, 'rand(', ')', (match, arg) => `randInt(${arg})`);
    text = replace(text, escRegex('camp.returnToCampUseOneHour'), 'passTime(1)');
    text = replace(text, escRegex('camp.returnToCampUseTwoHours'), 'passTime(2)');
    text = replace(text, escRegex('camp.returnToCampUseFourHours'), 'passTime(4)');
    text = replace(text, escRegex('camp.returnToCampUseEightHours'), 'passTime(8)');
    text = replace(text, escRegex('Appearance.'), '');
    text = replace(text, /game\.(\w)/g, (match, p1) => p1);
    text = replace(text, escRegex('kGAMECLASS.'), '');
    text = replace(text, escRegex('CoC.'), '');
    text = replace(text, escRegex('kFLAGS.'), `${className}Flags.`);
    // Unused - whitney
    // Manual - monk
    // Manual - sand
    // Manual - giacomo

    text = replace(text, escRegex('model.time.hours'), 'Time.hour');
    text = replace(text, escRegex('model.time.days'), 'Time.day');
    text = replace(text, escRegex('model.time.day'), 'Time.day');

    text = replace(text, escRegex('gameOver()'), 'return gameOverMenu()');
    text = replace(text, escRegex('cockNoun('), 'nounCock(');

    // Classes
    text = fixUtils(text);
    text = fixItems(text);
    text = fixBreastRowClass(text);
    text = fixAssClass(text);
    text = fixVaginaClass(text);
    text = fixCockClass(text);
    text = fixCreatureClass(text, 'player');
    text = fixCreatureClass(text, 'monster');
    text = fixCreatureClass(text, 'this');
    text = fixCharacterClass(text);
    text = fixPlayerClass(text);
    text = fixMonsterClass(text);
    text = fixBaseContent(text, className);

    // Enums
    text = replace(text, escRegex('StatusAffects.'), 'EffectType.');
    text = replace(text, escRegex('PerkLib.'), 'EffectType.');
    text = replace(text, escRegex('CockTypesEnum.'), 'CockType.');
    text = replace(text, escRegex('PregnancyStore.PREGNANCY_'), 'PregnancyType.');
    text = replace(text, escRegex('PregnancyStore.INCUBATION_'), 'IncubationTime.');
    text = replace(text, escRegex('GENDER_'), 'Gender.');
    text = replace(text, escRegex('SKIN_TYPE_'), 'SkinType.');
    text = replace(text, escRegex('HAIR_'), 'HairType.');
    text = replace(text, escRegex('FACE_'), 'FaceType.');
    text = replace(text, escRegex('TONGUE_'), 'TongueType.');
    text = replace(text, escRegex('TONUGE_'), 'TongueType.');
    text = replace(text, escRegex('EYES_'), 'EyeType.');
    text = replace(text, escRegex('EARS_'), 'EarType.');
    text = replace(text, escRegex('HORNS_'), 'HornType.');
    text = replace(text, escRegex('ANTENNAE_'), 'AntennaeType.');
    text = replace(text, escRegex('ARM_TYPE_'), 'ArmType.');
    text = replace(text, escRegex('TAIL_TYPE_'), 'TailType.');
    text = replace(text, escRegex('BREAST_CUP_'), 'BreastCup.');
    text = replace(text, escRegex('WING_TYPE_'), 'WingType.');
    text = replace(text, escRegex('LOWER_BODY_TYPE_'), 'LegType.');
    text = replace(text, escRegex('PIERCING_TYPE_'), 'PiercingType.');
    text = replace(text, escRegex('VAGINA_TYPE_'), 'VaginaType.');
    text = replace(text, escRegex('VAGINA_WETNESS_'), 'VaginaWetness.');
    text = replace(text, escRegex('VAGINA_LOOSENESS_'), 'VaginaLooseness.');
    text = replace(text, escRegex('ANAL_WETNESS_'), 'ButtWetness.');
    text = replace(text, escRegex('ANAL_LOOSENESS_'), 'ButtLooseness.');
    text = replace(text, escRegex('HIP_RATING_'), 'HipRating.');
    text = replace(text, escRegex('BUTT_RATING_'), 'ButtRating.');

    // Inventory
    text = fixInventory(text);

    // Special post cases
    text = replace(text, /player\.stats\.lus=/g, (match, p1) => `player.stats.lustNoResist${p1}`);
    text = replace(text, /player\.stats\.lus([^t])/g, (match, p1) => `player.stats.lust${p1}`);
    text = replace(text, /player\.stats\.sen([^s])/g, (match, p1) => `player.stats.sens${p1}`);
    text = replace(text, escRegex('player.butt'), 'player.body.butt');
    text = replace(text, escRegex('clearOutput()'), 'CView.clear()');
    text = replace(text, escRegex('export function timeChange'), 'public timeChange');
    text = replace(text, escRegex('export function timeChangeLarge'), 'public timeChangeLarge');
    text = funcReplacer(text, /player\.body\.\w+\.get\(([^\d])/, ')', (match, p1, p2) => p1 + (p2 !== undefined ? p2 : ''));
    text = replace(text, /player\.body\.tail\.type\s*>\s*TailType.NONE/g, 'player.body.tails.length > 0');

    text = replace(text, escRegex('player.effects.getByName(EffectType.Exgartuan).value1'), 'ExgartuanFlags.LOCATION');
    text = replace(text, escRegex('player.effects.getByName(EffectType.Exgartuan).value2'), 'ExgartuanFlags.SLEEP_COUNTER');

    return text;
}

function fixInventory(text: string): string {
    text = funcReplacer(text, 'inventory.takeItem(', ')',
        (match, item, next) => {
            // const type = item.split('Name')[0];
            return `return player.inventory.items.createAdd(player, ${item}, ${next})`;
        }
    );
    text = replace(text, escRegex('inventory.hasItemInStorage'), 'player.inventory.items.has');
    text = replace(text, escRegex('inventory.consumeItemInStorage'), 'player.inventory.items.consumeItem');
    return text;
}

function fixUtils(text: string): string {
    text = replace(text, escRegex('num2Text'), 'numToCardinalText');
    text = replace(text, escRegex('Num2Text'), 'numToCardinalCapText');
    text = replace(text, escRegex('num2Text2'), 'numToOrdinalText');
    return text;
}

function fixItems(text: string): string {
    // public const ([^:]+):[\w\s=\(".,\n\-\'?\):{}\\<>\/!+]+;
    // Weapons
    const weapons = [
        ['weapons.B_SWORD', 'WeaponName.BeautifulSword'],
        ['weapons.CLAYMOR', 'WeaponName.LargeClaymore'],
        ['weapons.DRGNSHL', 'WeaponName.DragonShellShield'],
        ['weapons.E_STAFF', 'WeaponName.EldritchStaff'],
        ['weapons.URTAHLB', 'WeaponName.UrtaHalberd'],
        ['weapons.H_GAUNT', 'WeaponName.HookedGauntlet'],
        ['weapons.JRAPIER', 'WeaponName.JeweledRapier'],
        ['weapons.KATANA ', 'WeaponName.Katana'],
        ['weapons.L__AXE', 'WeaponName.LargeAxe'],
        ['weapons.L_DAGGR', 'WeaponName.AphroDagger'],
        ['weapons.L_HAMMR', 'WeaponName.LargeHammer'],
        ['weapons.PIPE   ', 'WeaponName.Pipe'],
        ['weapons.RIDINGC', 'WeaponName.RidingCrop'],
        ['weapons.RRAPIER', 'WeaponName.RaphaelsRapier'],
        ['weapons.S_BLADE', 'WeaponName.Spellblade'],
        ['weapons.S_GAUNT', 'WeaponName.SpikedGauntlet'],
        ['weapons.SPEAR  ', 'WeaponName.Spear'],
        ['weapons.SUCWHIP', 'WeaponName.SuccubiWhip'],
        ['weapons.W_STAFF', 'WeaponName.WizardsStaff'],
        ['weapons.WARHAMR', 'WeaponName.HugeWarhammer'],
        ['weapons.WHIP   ', 'WeaponName.Whip'],
    ];
    // Armor
    // Manual - COMFORTABLE_UNDERCLOTHES
    const armors = [
        ['armors.ADVCLTH', 'GreenClothes'],
        ['armors.B_DRESS', 'LongDress'],
        ['armors.BEEARMR', 'BeeArmor'],
        ['armors.BIMBOSK', 'BimboSkirt'],
        ['armors.BONSTRP', 'BondageStraps'],
        ['armors.C_CLOTH', 'ComfortClothes'],
        ['armors.CHBIKNI', 'ChainmailBikini'],
        ['armors.CLSSYCL', 'SuitClothes'],
        ['armors.FULLCHN', 'FullChainmail'],
        ['armors.FULLPLT', 'FullPlatemail'],
        ['armors.FURLOIN', 'FurLoincloth'],
        ['armors.GELARMR', 'ArmorName.GelArmor'],
        ['armors.GOOARMR', 'ArmorName.GooArmor'],
        ['armors.I_CORST', 'ArmorName.InquisitorsCorset'],
        ['armors.I_ROBES', 'ArmorName.InquisitorsRobes'],
        ['armors.INDECST', 'ArmorName.IndecentSteelArmor'],
        ['armors.LEATHRA', 'ArmorName.LeatherArmor'],
        ['armors.URTALTA', 'ArmorName.LeatherArmorSegments'],
        ['armors.LMARMOR', 'ArmorName.LustyMaidensArmor'],
        ['armors.LTHRPNT', 'ArmorName.TightLeatherPants'],
        ['armors.LTHRROB', 'ArmorName.LeatherRobes'],
        ['armors.M_ROBES', 'ArmorName.ModestRobes'],
        ['armors.NURSECL', 'ArmorName.NurseOutfit'],
        ['armors.OVERALL', 'ArmorName.Overalls'],
        ['armors.R_BDYST', 'ArmorName.RedBodysuit'],
        ['armors.RBBRCLT', 'ArmorName.RubberFetishClothes'],
        ['armors.S_SWMWR', 'ArmorName.SluttySwimwear'],
        ['armors.SCALEML', 'ArmorName.Scalemail'],
        ['armors.SEDUCTA', 'ArmorName.SeductiveArmor'],
        ['armors.SS_ROBE', 'ArmorName.SpidersilkRobes'],
        ['armors.SSARMOR', 'ArmorName.SpidersilkArmor'],
        ['armors.T_BSUIT', 'ArmorName.SemiTransBodysuit'],
        ['armors.TUBETOP', 'ArmorName.TubeTop'],
        ['armors.W_ROBES', 'ArmorName.WizardRobes'],
    ];
    // Useables
    const useables = [
        ['useables.B_CHITN', 'MaterialName.BlackChitin'],
        ['useables.GLDSTAT', 'MaterialName.GoldenStatue'],
        ['useables.GREENGL', 'MaterialName.GreenGel'],
        ['useables.T_SSILK', 'MaterialName.ToughSpiderSilk'],
    ];

    // Consumables
    const consumables = [
        ['consumables.AUBURND', 'ConsumableName.HairDyeAuburn'],
        ['consumables.B__BOOK', 'ConsumableName.BlackSpellbook'],
        ['consumables.B_GOSSR', 'ConsumableName.BlackGossamer'],
        ['consumables.BC_BEER', 'ConsumableName.BlackCatBeer'],
        ['consumables.BEEHONY', 'ConsumableName.BeeHoney'],
        ['consumables.BIMBOCH', 'ConsumableName.BimboChampagne'],
        ['consumables.BIMBOLQ', 'ConsumableName.BimboLiqueur'],
        ['consumables.BLACK_D', 'ConsumableName.HairDyeBlack'],
        ['consumables.BLACKEG', 'ConsumableName.EggBlack'],
        ['consumables.BLACKPP', 'ConsumableName.CaninePepperBlack'],
        ['consumables.BLOND_D', 'ConsumableName.HairDyeBlonde'],
        ['consumables.BLUEDYE', 'ConsumableName.HairDyeDarkBlue'],
        ['consumables.BLUEEGG', 'ConsumableName.EggBlue'],
        ['consumables.BROBREW', 'ConsumableName.BroBrew'],
        ['consumables.BROWN_D', 'ConsumableName.HairDyeBrown'],
        ['consumables.BROWNEG', 'ConsumableName.EggBrown'],
        ['consumables.BULBYPP', 'ConsumableName.CaninePepperBulbous'],
        ['consumables.CANINEP', 'ConsumableName.CaninePepper'],
        ['consumables.CCUPCAK', 'ConsumableName.GiantChocolateCupcake'],
        ['consumables.CERUL_P', 'ConsumableName.CeruleanPotion'],
        ['consumables.COAL___', 'ConsumableName.Coal'],
        ['consumables.DBLPEPP', 'ConsumableName.CaninePepperDouble'],
        ['consumables.DEBIMBO', 'ConsumableName.DeBimbo'],
        ['consumables.DRGNEGG', 'ConsumableName.DragonEgg'],
        ['consumables.DRYTENT', 'ConsumableName.ShriveledTentacle'],
        ['consumables.ECTOPLS', 'ConsumableName.Ectoplasm'],
        ['consumables.EQUINUM', 'ConsumableName.Equinum'],
        ['consumables.EXTSERM', 'ConsumableName.HairExtensionSerum'],
        ['consumables.F_DRAFT', 'ConsumableName.LustDraftEnhanced'],
        ['consumables.FISHFIL', 'ConsumableName.FishFillet'],
        ['consumables.FOXBERY', 'ConsumableName.FoxBerry'],
        ['consumables.FRRTFRT', 'ConsumableName.FerretFruit'],
        ['consumables.FOXJEWL', 'ConsumableName.FoxJewel'],
        ['consumables.GLDSEED', 'ConsumableName.GoldenSeed'],
        ['consumables.GODMEAD', 'ConsumableName.GodsMead'],
        ['consumables.GOB_ALE', 'ConsumableName.GoblinAle'],
        ['consumables.GRAYDYE', 'ConsumableName.HairDyeGray'],
        ['consumables.GREEN_D', 'ConsumableName.HairDyeGreen'],
        ['consumables.GROPLUS', 'ConsumableName.GroPlus'],
        ['consumables.HUMMUS_', 'ConsumableName.Hummus'],
        ['consumables.IMPFOOD', 'ConsumableName.ImpFood'],
        ['consumables.INCUBID', 'ConsumableName.IncubusDraft'],
        ['consumables.IZYMILK', 'ConsumableName.IsabellaMilk'],
        ['consumables.KANGAFT', 'ConsumableName.KangaFruit'],
        ['consumables.KITGIFT', 'ConsumableName.KitsuneGift'],
        ['consumables.KNOTTYP', 'ConsumableName.CaninePepperKnotty'],
        ['consumables.L_DRAFT', 'ConsumableName.LustDraft'],
        ['consumables.L_BLKEG', 'ConsumableName.LargeEggBlack'],
        ['consumables.L_BLUEG', 'ConsumableName.LargeEggBlue'],
        ['consumables.L_BRNEG', 'ConsumableName.LargeEggBrown'],
        ['consumables.L_PNKEG', 'ConsumableName.LargeEggPink'],
        ['consumables.L_PRPEG', 'ConsumableName.LargeEggPurple'],
        ['consumables.L_WHTEG', 'ConsumableName.LargeEggWhite'],
        ['consumables.LABOVA_', 'ConsumableName.LaBova'],
        ['consumables.LACTAID', 'ConsumableName.Lactaid'],
        ['consumables.LARGEPP', 'ConsumableName.CaninePepperLarge'],
        ['consumables.LUSTSTK', 'ConsumableName.LustStick'],
        ['consumables.M__MILK', 'ConsumableName.MarbleMilk'],
        ['consumables.MAGSEED', 'ConsumableName.GoldenSeedEnhanced'],
        ['consumables.MGHTYVG', 'ConsumableName.KangaFruitEnhanced'],
        ['consumables.MOUSECO', 'ConsumableName.MouseCocoa'],
        ['consumables.MINOBLO', 'ConsumableName.MinotaurBlood'],
        ['consumables.MINOCUM', 'ConsumableName.MinotaurCum'],
        ['consumables.MYSTJWL', 'ConsumableName.FoxJewelEnhanced'],
        ['consumables.NUMBROX', 'ConsumableName.NumbRock'],
        ['consumables.NPNKEGG', 'ConsumableName.NeonPinkEgg'],
        ['consumables.ORANGDY', 'ConsumableName.HairDyeBrightOrange'],
        ['consumables.OVIELIX', 'ConsumableName.OvipositionElixir'],
        ['consumables.P_DRAFT', 'ConsumableName.IncubusDraftPure'],
        ['consumables.P_LBOVA', 'ConsumableName.LaBovaPure'],
        ['consumables.P_PEARL', 'ConsumableName.PurePearl'],
        ['consumables.P_S_MLK', 'ConsumableName.SuccubiMilkPure'],
        ['consumables.P_WHSKY', 'ConsumableName.PhoukaWhiskey'],
        ['consumables.PEPPWHT', 'ConsumableName.PeppermintWhite'],
        ['consumables.PINKDYE', 'ConsumableName.HairDyeNeonPink'],
        ['consumables.PINKEGG', 'ConsumableName.EggPink'],
        ['consumables.PRFRUIT', 'ConsumableName.PurpleFruit'],
        ['consumables.PROBOVA', 'ConsumableName.LaBovaEnhanced'],
        ['consumables.PSDELIT', 'ConsumableName.SuccubisDelightPure'],
        ['consumables.PURHONY', 'ConsumableName.BeeHoneyPure'],
        ['consumables.PURPDYE', 'ConsumableName.HairDyePurple'],
        ['consumables.PURPEAC', 'ConsumableName.PurityPeach'],
        ['consumables.PURPLEG', 'ConsumableName.EggPurple'],
        ['consumables.RED_DYE', 'ConsumableName.HairDyeRed'],
        ['consumables.REPTLUM', 'ConsumableName.Reptilum'],
        ['consumables.REDUCTO', 'ConsumableName.Reducto'],
        ['consumables.RINGFIG', 'ConsumableName.RingtailFig'],
        ['consumables.RIZZART', 'ConsumableName.RizzaRoot'],
        ['consumables.S_DREAM', 'ConsumableName.SuccubisDream'],
        ['consumables.S_GOSSR', 'ConsumableName.SweetGossamer'],
        ['consumables.SDELITE', 'ConsumableName.SuccubisDelight'],
        ['consumables.SENSDRF', 'ConsumableName.SensitivityDraft'],
        ['consumables.SHARK_T', 'ConsumableName.SharkTooth'],
        ['consumables.SHEEPMK', 'ConsumableName.SheepMilk'],
        ['consumables.SMART_T', 'ConsumableName.ScholarsTea'],
        ['consumables.SNAKOIL', 'ConsumableName.SnakeOil'],
        ['consumables.SPHONEY', 'ConsumableName.BeeHoneySpecial'],
        ['consumables.SUCMILK', 'ConsumableName.SuccubiMilk'],
        ['consumables.TRAPOIL', 'ConsumableName.TrapOil'],
        ['consumables.TSCROLL', 'ConsumableName.TatteredScroll'],
        ['consumables.TSTOOTH', 'ConsumableName.SharkToothEnhanced'],
        ['consumables.VITAL_T', 'ConsumableName.VitalityTincture'],
        ['consumables.VIXVIGR', 'ConsumableName.FoxBerryEnhanced'],
        ['consumables.W__BOOK', 'ConsumableName.WhiteSpellbook'],
        ['consumables.W_FRUIT', 'ConsumableName.WhiskerFruit'],
        ['consumables.W_STICK', 'ConsumableName.WingStick'],
        ['consumables.WETCLTH', 'ConsumableName.WetCloth'],
        ['consumables.WHITEDY', 'ConsumableName.HairDyeWhite'],
        ['consumables.WHITEEG', 'ConsumableName.EggWhite'],
        ['consumables.PRNPKR', 'ConsumableName.PrincessPucker'],
        ['consumables.HRBCNT', 'ConsumableName.HerbalContraceptive'],
        // Manual - LARGE_EGGS
        // Manual - SMALL_EGGS
    ];

    for (const type of [weapons, armors, useables, consumables])
        for (const item of type)
            text = replace(text, escRegex(item[0]), item[1]);

    return text;
}

function fixBaseContent(text: string, className?: string): string {
    text = replace(text, /getGame\(\)\.?/g, '');
    // Unknown - cheatTime
    // OK - isHalloween
    // OK - isValentine
    // OK - isHolidays
    // OK - isThanksgiving
    text = replace(text, escRegex('showStats'), 'MainScreen.stats.show()');
    text = replace(text, escRegex('statScreenRefresh();'), '');
    text = replace(text, escRegex('cleanupAfterCombat()'), 'return { next: passTime(1) }');
    text = replace(text, escRegex('cleanupAfterCombat'), 'passTime(1)');
    // Manual - combatRoundOver
    // Manual - enemyAI
    if (className) text = funcReplacer(text, 'spriteSelect(', ')', (match, ...sprite) => `CView.sprite(SpriteName.${className}); // ${sprite}`);
    text = replace(text, escRegex('hideStats()'), '');
    text = replace(text, escRegex('hideUpDown()'), '');
    text = replace(text, escRegex('createCallBackFunction'), 'choiceWrap');
    text = replace(text, escRegex('createCallBackFunction2'), 'choiceWrap');
    text = replace(text, escRegex('startCombat('), 'return CombatManager.beginBattle(player, ');
    // Manual - startCombatImmediate
    // Unused - rawOutputText
    text = funcReplacer(text, 'outputText(', ');',
        (match, quoteText, flag) => {
            let fixed = '';
            if (quoteText.startsWith('images')) {
                return quoteText.replace(/images\.showImage\(\"([^\"]+)\"\)/, 'CView.image("$1");');
            }
            if (flag === 'true') {
                fixed += '.clear();\nCView';
            }
            if (quoteText !== '""') {
                fixed += `.text(${quoteText})`;
            }
            if (quoteText === '""') {
                return '';
            }
            return fixed ? `CView${fixed};` : '';
        }
    );

    // Special - clearOutput
    text = funcReplacer(text, 'doNext(', ');', (match, func) => `return { next: ${func} };`);
    text = replace(text, escRegex('menu();'), '');
    text = replace(text, escRegex('hideMenus()'), 'MainScreen.topButtons.hide()');
    text = funcReplacer(text,
        /(?:choices|simpleChoices)\(/, ')',
        (match, ...choices) =>
            'return { choices: [ ' +
            choices.reduce(
                (prev, curr, index) =>
                    prev + (index % 2 === 0 ? `[${curr}, ` : `${curr}], `),
                '') +
            ' ] }'
    );
    text = funcReplacer(text, 'doYesNo(', ');', (match, choice1, choice2) => `return { yes: ${choice1}, no: ${choice2} };`);
    text = funcReplacer(text, 'addButton(', ')', (match, index, choiceText, choiceFunc, ...args) => `choices[${index}] = [${choiceText}, ${args ? [choiceFunc].concat(args).join(', ') : choiceFunc}]`);
    // Unused - hasButton
    text = replace(text, escRegex('sackDescript()'), 'describeSack(player)');
    // Manual - cockClit
    // Unused - sheathDesc
    text = replace(text, escRegex('chestDesc()'), 'describeChest(player)');
    text = replace(text, escRegex('allChestDesc()'), 'describeEntireChest(player)');
    text = replace(text, escRegex('allBreastsDescript()'), 'describeAllBreasts(player)');
    text = replace(text, escRegex('sMultiCockDesc()'), 'describeOneOfYourCocks(player)');
    text = replace(text, escRegex('SMultiCockDesc()'), 'describeOneOfYourCocks(player, true)');
    text = replace(text, escRegex('oMultiCockDesc()'), 'describeEachOfYourCocks(player)');
    text = replace(text, escRegex('OMultiCockDesc()'), 'describeEachOfYourCocks(player, true)');
    text = replace(text, escRegex('tongueDescript()'), 'describeTongue(player)');
    text = replace(text, escRegex('ballsDescriptLight()'), 'describeBalls(true, true, player)');
    text = replace(text, escRegex('ballsDescriptLight(true)'), 'describeBalls(true, true, player)');
    text = replace(text, escRegex('ballsDescriptLight(false)'), 'describeBalls(false, true, player)');
    text = replace(text, escRegex('ballDescript()'), 'describeBalls(false, false, player)');
    text = replace(text, escRegex('ballsDescript()'), 'describeBalls(false, true, player, true)');
    text = replace(text, escRegex('simpleBallsDescript()'), 'describeBalls(false, true, player)');
    text = replace(text, escRegex('assholeDescript()'), 'describeButthole(player.body.butt)');
    text = replace(text, escRegex('eAssholeDescript()'), 'describeButthole(monster.body.butt)');
    text = replace(text, escRegex('hipDescript()'), 'describeHips(player)');
    text = replace(text, escRegex('assDescript()'), 'describeButt(player)');
    text = replace(text, escRegex('buttDescript()'), 'describeButt(player)');
    text = replace(text, escRegex('assholeOrPussy()'), 'assholeOrPussy(player)');
    text = funcReplacer(text, 'nippleDescript(', ')', (match, index) => `describeNipple(player, player.body.chest.get(${index}))`);
    text = replace(text, escRegex('cockDescript()'), 'describeCock(player, player.body.cocks.get(0))');
    text = funcReplacer(text, 'cockDescript(', ')', (match, index) => `describeCock(player, player.body.cocks.get(${index}))`);
    text = replace(text, escRegex('multiCockDescript()'), 'describeCocks(player)');
    text = replace(text, escRegex('multiCockDescriptLight()'), 'describeCocksLight(player)');
    text = funcReplacer(text, 'breastDescript(', ')', (match, index) => `describeBreastRow(player.body.chest.get(${index}))`);
    text = funcReplacer(text, 'breastSize(', ')', (match, size) => `describeBreastSize(${size})`);
    text = replace(text, escRegex('biggestBreastSizeDescript()'), 'describeBiggestBreastRow(player)');
    text = replace(text, escRegex('hairDescript()'), 'describeHair(player)');
    text = replace(text, escRegex('hairOrFur()'), 'hairOrFur(player)');
    text = replace(text, escRegex('clitDescript()'), 'describeClit(player)');
    text = replace(text, escRegex('vaginaDescript()'), 'describeVagina(player, player.body.vaginas.get(0))');
    text = funcReplacer(text, 'vaginaDescript(', ')', (match, index) => `describeVagina(player, player.body.vaginas.get(${index}))`);
    text = replace(text, escRegex('allVaginaDescript()'), 'describeAllVagina(player)');
    text = funcReplacer(text, 'dynStats(', ');',
        (match, ...stats) => {
            let op: string;
            return stats.reduce((prev, curr, index) => {
                if (index % 2 === 0) {
                    op = curr[curr.length - 2];
                    if (op === '=' || op === '+' || op === '-')
                        return prev + `player.stats.${curr.substr(1, curr.length - 3)} `;
                    else
                        return prev + `player.stats.${curr.substr(1, curr.length - 2)} `;
                }
                else {
                    if (op === '=')
                        return prev + `= ${curr};\n`;
                    else if (op === '+')
                        return prev + `+= ${curr};\n`;
                    else if (op === '-')
                        return prev + `-= ${curr};\n`;
                    else
                        return prev + `+= ${curr};\n`;
                }
            }, '');
        }
    );
    text = replace(text, escRegex('silly()'), 'Settings.silly()');
    text = funcReplacer(text, 'HPChange(', ')',
        (match, amt, display) =>
            display === 'true' || display !== 'false' ?
                `displayCharacterHPChange(player, ${amt})` :
                `player.stats.HP += ${amt} `
    );
    text = funcReplacer(text, 'fatigue(', ')',
        (match, amt, type) =>
            type === '1' ? `player.stats.fatigueMagical(${amt})` :
                (type === '2' ? `player.stats.fatiguePhysical(${amt})` :
                    `player.stats.fatigue += ${amt} `)
    );
    text = replace(text, escRegex('playerMenu'), 'playerMenu');
    text = replace(text, escRegex('showStatDown'), '');
    text = replace(text, escRegex('showStatUp'), '');
    return text;
}

function fixBreastRowClass(text: string): string {
    text = replace(text, /breastRows\[([^\]]+)\]\.nipplesPerBreast/g, (match, index) => `breastRows.get(${index}).nipples.count`);
    text = replace(text, /breastRows\[([^\]]+)\]\.fuckable/g, (match, index) => `breastRows.get(${index}).nipples.fuckable`);
    text = replace(text, /breastRows\[([^\]]+)\]\.breasts/g, (match, index) => `breastRows.get(${index}).count`);
    text = replace(text, /breastRows\[([^\]]+)\]\.breastRating/g, (match, index) => `breastRows.get(${index}).rating`);
    text = replace(text, /breastRows\[([^\]]+)\]\.lactationMultiplier/g, (match, index) => `breastRows.get(${index}).lactationMultiplier`);
    text = replace(text, /breastRows\[([^\]]+)\]\.milkFullness/g, (match, index) => `breastRows.get(${index}).milkFullness`);
    text = replace(text, /breastRows\[([^\]]+)\]\.fullness/g, (match, index) => `breastRows.get(${index}).fullness`);
    return text;
}

function fixAssClass(text: string): string {
    text = replace(text, escRegex('ass.analWetness'), `ass.wetness`);
    text = replace(text, escRegex('ass.analLooseness'), `ass.looseness`);
    return text;
}

function fixVaginaClass(text: string): string {
    text = replace(text, /vaginas\[([^\]]+)\]\.vaginalWetness/g, (match, index) => `vaginas.get(${index}).wetness`);
    text = replace(text, /vaginas\[([^\]]+)\]\.vaginalLooseness/g, (match, index) => `vaginas.get(${index}).looseness`);
    text = replace(text, /vaginas\[([^\]]+)\]\.virgin/g, (match, index) => `vaginas.get(${index}).virgin`);
    return text;
}

function fixCockClass(text: string): string {
    text = replace(text, /cocks\[([^\]]+)\]\.cockLength/g, (match, index) => `cocks.get(${index}).length`);
    text = replace(text, /cocks\[([^\]]+)\]\.cockThickness/g, (match, index) => `cocks.get(${index}).thickness`);
    text = replace(text, /cocks\[([^\]]+)\]\.cockType/g, (match, index) => `cocks.get(${index}).type`);
    text = replace(text, /cocks\[([^\]]+)\]\.knotMultiplier/g, (match, index) => `cocks.get(${index}).knotMultiplier`);
    return text;
}

function fixMonsterClass(text: string): string {
    text = replace(text, escRegex('monster.bonusHP'), 'monster.stats.bonusHP');
    text = replace(text, escRegex('this.bonusHP'), 'this.baseStats.bonusHP');
    text = replace(text, escRegex('monster.long'), 'monster.desc.long');
    text = replace(text, escRegex('monster.plural'), 'monster.desc.plural');
    text = replace(text, escRegex('monster.lustVuln'), 'monster.stats.lustVuln');
    text = replace(text, /monster\.[pP]rnoun1/g, 'monster.desc.subjectivePronoun');
    text = replace(text, /monster\.[pP]rnoun2/g, 'monster.desc.objectivePronoun');
    text = replace(text, /monster\.[pP]rnoun3/g, 'monster.desc.possessivePronoun');
    text = replace(text, escRegex('monster.drop'), 'monster.combat.rewards.drop');
    text = replace(text, escRegex('monster.eMaxHP'), 'monster.desc.long');
    text = replace(text, escRegex('monster.addHP'), 'monster.combat.gainHP');
    text = replace(text, escRegex('monster.HPRatio'), 'monster.combat.HPRatio');
    text = replace(text, escRegex('monster.eBaseDamage'), 'monster.combat.weaponAttack');
    // Unused - calcDamage
    text = replace(text, escRegex('monster.eBaseDamage'), 'monster.combat.weaponAttack');
    // Manual - eOneAttack
    // Manual - eAttack
    // Manual - outputAttack
    // Manual - doAI
    // Manual - defeated
    // Manual - won
    // Manual - onDefeated
    // Manual - onWon
    // Manual - onPcRunAttempt
    // Manual - defeated_
    // Manual - won_
    // Manual - teased
    // Manual - dropLoot
    // Manual - combatRoundUpdate
    // Manual - handleAwardItemText
    // Manual - handleAwardText
    // Manual - handleCombatLossText

    text = funcReplacer(text, 'initStrTouSpeInte(', ');',
        (match, str, tou, spe, int) =>
            trimLeft`this.stats.base.str.value = ${str};
            this.stats.base.tou.value = ${tou};
            this.stats.base.spe.value = ${spe};
            this.stats.base.int.value = ${int};`
    );
    text = funcReplacer(text, 'initLibSensCor(', ');',
        (match, lib, sens, cor) =>
            trimLeft`this.stats.base.lib.value = ${lib};
            this.stats.base.sens.value = ${sens};
            this.stats.base.cor.value = ${cor};`
    );
    text = funcReplacer(text, 'createBreastRow(', ')', (match, ...args) => `this.body.chest.add(new BreastRow(${args.join(', ')}))`);
    text = replace(text, escRegex('createBreastRow()'), 'this.body.chest.add(new BreastRow())');

    return text;
}

function fixPlayerClass(text: string): string {
    // Manual - slotName
    // Manual - autoSave
    text = replace(text, escRegex('player.lustVuln'), 'player.stats.lustVuln');
    text = replace(text, escRegex('player.teaseLevel'), 'player.stats.teaseLevel');
    text = replace(text, escRegex('player.teaseXP'), 'player.stats.teaseXP');
    text = replace(text, escRegex('player.perkPoints'), 'player.stats.perkPoints');
    text = replace(text, escRegex('player.exploredForest'), 'ExplorationFlags.FOREST');
    text = replace(text, escRegex('player.exploredDesert'), 'ExplorationFlags.DESERT');
    text = replace(text, escRegex('player.exploredMountain'), 'ExplorationFlags.MOUNTAIN');
    text = replace(text, escRegex('player.exploredLake'), 'ExplorationFlags.LAKE');
    text = replace(text, escRegex('player.explored'), 'ExplorationFlags.BEYOND_CAMP');
    // Unused - pregnancyUpdate
    // Manual - itemSlot[1-5]
    text = replace(text, escRegex('player.modArmorName'), 'player.inventory.modifiedArmorDesc');
    // Unused - armorBaseDef
    // Unused - weaponBaseAttack
    text = replace(text, escRegex('player.armor'), 'player.inventory.armor');
    text = funcReplacer(text, 'player.setArmor(', ')', (match, armor) => `player.inventory.equippedArmorSlot.equip(${armor})`);
    // Unused - setArmorHiddenField
    text = replace(text, escRegex('player.weapon'), 'player.inventory.weapon');
    text = funcReplacer(text, 'player.setWeapon(', ')', (match, weapon) => `player.inventory.equippedWeaponSlot.equip(${weapon})`);
    // Unused - setWeaponHiddenField
    // Unused - reduceDamage
    // Manual - takeDamage
    // Unused - speedDodge
    text = replace(text, escRegex('player.bodyType()'), 'describeBody(player)');
    text = replace(text, escRegex('player.race()'), 'describeRace(player)');
    text = replace(text, escRegex('player.demonScore()'), 'demonRaceScore(player)');
    text = replace(text, escRegex('player.humanScore()'), 'humanRaceScore(player)');
    text = replace(text, escRegex('player.minoScore()'), 'minotaurRaceScore(player)');
    // Unused - minotaurScore
    text = replace(text, escRegex('player.cowScore()'), 'cowRaceScore(player)');
    text = replace(text, escRegex('player.sandTrapScore()'), 'sandTrapRaceScore(player)');
    text = replace(text, escRegex('player.beeScore()'), 'beeRaceScore(player)');
    text = replace(text, escRegex('player.ferretScore()'), 'ferretRaceScore(player)');
    text = replace(text, escRegex('player.mouseScore()'), 'mouseRaceScore(player)');
    text = replace(text, escRegex('player.raccoonScore()'), 'raccoonRaceScore(player)');
    text = replace(text, escRegex('player.catScore()'), 'catRaceScore(player)');
    text = replace(text, escRegex('player.lizardScore()'), 'lizardRaceScore(player)');
    text = replace(text, escRegex('player.spiderScore()'), 'spiderRaceScore(player)');
    text = replace(text, escRegex('player.horseScore()'), 'horseRaceScore(player)');
    text = replace(text, escRegex('player.kitsuneScore()'), 'kitsuneRaceScore(player)');
    text = replace(text, escRegex('player.dragonScore()'), 'dragonRaceScore(player)');
    text = replace(text, escRegex('player.goblinScore()'), 'goblinRaceScore(player)');
    text = replace(text, escRegex('player.gooScore()'), 'gooRaceScore(player)');
    text = replace(text, escRegex('player.nagaScore()'), 'nagaRaceScore(player)');
    text = replace(text, escRegex('player.bunnyScore()'), 'bunnyRaceScore(player)');
    text = replace(text, escRegex('player.harpyScore()'), 'harpyRaceScore(player)');
    text = replace(text, escRegex('player.kangaScore()'), 'kangarooRaceScore(player)');
    text = replace(text, escRegex('player.sharkScore()'), 'sharkRaceScore(player)');
    text = replace(text, escRegex('player.mutantScore()'), 'mutantRaceScore(player)');
    // OK - lactationQ
    // OK - isLactating
    text = funcReplacer(text, 'player.cuntChange(', ')', (match, ...args) => 'displayStretchVagina(player, ' + args.join(', ') + ')');
    text = funcReplacer(text, 'player.buttChange(', ')', (match, ...args) => 'displayStretchButt(player, ' + args.join(', ') + ')');
    text = replace(text, escRegex('player.buttChangeDisplay()'), 'stretchButtText(player)');
    // OK - slimeFeed
    // OK - minoCumAddiction
    text = replace(text, escRegex('player.hasSpells'), 'player.combat.hasSpells');
    text = replace(text, escRegex('player.spellCount'), 'player.combat.spellCount');
    text = replace(text, escRegex('player.hairDescript()'), 'describeHair(player)');
    text = replace(text, escRegex('player.shrinkTits()'), 'shrinkTits(player)');
    text = replace(text, escRegex('player.shrinkTits(true)'), 'shrinkTits(player, true)');
    text = funcReplacer(text, 'player.growTits(', ')',
        (match, arg1, arg2, arg3, type) => {
            switch (type) {
                case '1': return `growSmallestBreastRow(player, ${arg1}, ${arg2}, ${arg3})`;
                case '2': return `growTopBreastRowDownwards(player, ${arg1}, ${arg2}, ${arg3})`;
                case '3': return `growTopBreastRow(player, ${arg1}, ${arg2}, ${arg3})`;
                default: return match;
            }
        });
    text = replace(text, escRegex('player.minLust'), 'player.stats.minLust');
    text = replace(text, escRegex('player.minotaurAddicted'), 'minotaurAddicted');
    text = replace(text, escRegex('player.minotaurNeed'), 'minotaurNeed');
    text = replace(text, escRegex('player.clearStatuses(true);'), '');
    text = replace(text, escRegex('player.clearStatuses(false);'), '');
    text = replace(text, escRegex('player.consumeItem'), 'player.inventory.items.consumeItem');
    // Unused - getLowestSlot
    text = replace(text, escRegex('player.hasItem'), 'player.inventory.items.has');
    text = funcReplacer(text, 'player.itemCount(', ')', (match, itemName) => `player.inventory.items.filter(Inventory.FilterName(${itemName})).reduce(Inventory.TotalQuantity, 0)`);
    // Unused - roomInExistingStack
    text = funcReplacer(text, 'player.roomInExistingStack(', ')', (match, itemName) => `player.inventory.items.find(Inventory.FilterName(${itemName}))`);
    // Unsed - itemSlot
    // Unsed - emptySlot
    text = replace(text, escRegex('player.destroyItems'), 'player.inventory.items.consumeItem');
    text = funcReplacer(text, 'player.lengthChange(', ')', (match, arg1, arg2) => `displayLengthChange(player, ${arg1}, ${arg2})`);
    text = funcReplacer(text, 'player.killCocks(', ')', (match, amt) => `displayKillCocks(player, ${amt})`);
    // OK - modCumMultiplier
    text = funcReplacer(text, 'player.increaseCock(', ')', (match, arg1, arg2) => `growCock(player, ${arg1}, ${arg2})`);
    text = funcReplacer(text, 'player.increaseEachCock(', ')', (match, amt) => `growEachCock(player, ${amt})`);
    text = replace(text, escRegex('player.goIntoHeat(false)'), 'player.goIntoHeat()');
    text = funcReplacer(text, 'player.goIntoHeat(true,', ')', (match, amt) => `displayGoIntoHeat(player, ${amt})`);
    text = replace(text, escRegex('player.goIntoRut(false)'), 'player.goIntoRut()');
    text = funcReplacer(text, 'player.goIntoRut(true,', ')', (match, amt) => `displayGoIntoRut(player, ${amt})`);

    return text;
}

function fixCharacterClass(text: string): string {
    text = replace(text, escRegex('player.feminity'), 'player.body.femininity');
    text = replace(text, escRegex('player.beardLength'), 'player.body.beard.length');
    text = replace(text, escRegex('player.beardStyle'), 'player.body.beard.style');
    text = replace(text, escRegex('player.thickness'), 'player.body.thickness');
    text = replace(text, escRegex('player.tone'), 'player.body.tone');
    // Manual - pregnancyType
    // Manual - pregnancyIncubation
    // Manual - buttPregnancyType
    // Manual - buttPregnancyIncubation
    text = replace(text, escRegex('player.keyItems'), 'player.inventory.keyItems');
    text = replace(text, escRegex('player.faceDesc()'), 'describeFace(player)');
    text = funcReplacer(text, 'player.modFem(', ')', (match, ...args) => `modFem(player, ${args.join(', ')})`);
    text = funcReplacer(text, 'player.modThickness(', ')', (match, ...args) => `modThickness(player, ${args.join(', ')})`);
    text = funcReplacer(text, 'player.modTone(', ')', (match, ...args) => `modTone(player, ${args.join(', ')})`);
    // OK - fixFemininity
    text = replace(text, escRegex('player.hasBeard'), 'player.body.beard.length > 0');
    text = replace(text, escRegex('player.beard()'), 'describeBeard(player)');
    text = replace(text, escRegex('player.skin()'), 'describeSkin(player)');
    text = funcReplacer(text, 'player.skin(', ')', (match, ...args) => `describeSkin(player, ${args.join(', ')})`);
    text = replace(text, escRegex('player.hasMuzzle()'), 'player.body.face.hasMuzzle()');
    text = replace(text, escRegex('player.face()'), 'describeFaceShort(player)');
    // OK - hasLongTail
    text = replace(text, escRegex('player.isPregnant()'), 'player.body.wombs.find(Womb.IsPregnant)');
    text = replace(text, escRegex('player.isButtPregnant()'), 'player.body.buttWomb.isPregnant()');

    text = funcReplacer(text, 'player.knockUp(', ')', (match, type, time, chance, gurantee) => {
        if (gurantee)
            return `player.body.wombs.find(Womb.NotPregnant).knockUp(${type}, ${time}, ${chance}, true)`;
        else if (chance)
            return `attemptKnockUp(player, ${type}, ${time}, ${chance})`;
        else
            return `attemptKnockUp(player, ${type}, ${time})`;
    });
    text = funcReplacer(text, 'player.knockUpForce(', ')', (match, type, time) => `player.body.wombs.find(Womb.NotPregnant).knockUp(${type}, ${time}, 0, true)`);

    text = funcReplacer(text, 'player.buttKnockUp(', ')', (match, type, time, chance, gurantee) => {
        if (gurantee)
            return `player.body.buttWomb.knockUp(${type}, ${time}, ${chance}, true)`;
        else if (chance)
            return `player.body.buttWomb.knockUp(${type}, ${time}, ${chance})`;
        else
            return `player.body.buttWomb.knockUp(${type}, ${time})`;
    });
    text = funcReplacer(text, 'player.buttKnockUpForce(', ')', (match, type, time) => `player.body.buttWomb.knockUp(${type}, ${time}, 0, true)`);
    // Remove - pregnancyAdvance
    // Remove - pregnancyUpdate

    text = replace(text, escRegex('player.createKeyItem'), 'player.inventory.keyItems.add');
    text = funcReplacer(text, 'player.removeKeyItem(', ')', (match, item) => `player.inventory.keyItems.remove(${item})`);
    // Manual - addKeyValue
    text = funcReplacer(text, /player\.keyItemv([1-4])\(/, ')', (match, index, item) => `player.inventory.keyItems.get(${item}).value${index} `);
    // Unused - removeKeyItems
    text = funcReplacer(text, 'player.hasKeyItem(', /\)(?:\s*([!><=]+)\s*([-\d]+))?/,
        (match, item, compOp, compVal) => {
            if (compOp && compOp.match(/<=?|==/) && +compVal <= 0)
                return `!player.inventory.keyItems.has(${item})`;
            return `player.inventory.keyItems.has(${item})`;
        });

    // Unknown - viridianChange
    text = replace(text, escRegex('player.hasKnot()'), 'player.body.cocks.get(0).hasKnot()');
    text = funcReplacer(text, 'player.hasKnot(', ')', (match, index) => `player.body.cocks.get(${index}).hasKnot()`);
    text = replace(text, escRegex('player.maxHP()'), 'player.stats.maxHP');
    text = replace(text, escRegex('player.buttDescript()'), 'describeButt(player)');

    return text;
}

function fixCreatureClass(text: string, name: string): string {
    text = replace(text, combineStrRegex(name, /\.short([^\w])/g), (match, p1) => `${name}.desc.name${p1} `);
    text = replace(text, combineStrRegex(name, /\.a([^\w])/g), (match, p1) => `${name}.desc.a${p1} `);
    text = replace(text, escRegex(`${name}.capitalA`), `${name}.desc.capitalA`);

    text = replace(text, escRegex(`${name}.weaponName`), `${name}.inventory.weapon.displayName`);
    text = replace(text, escRegex(`${name}.weaponVerb`), `${name}.inventory.weapon.verb`);
    // This is for the calcuated attack, not weapon attack
    // Manual - assignment
    text = replace(text, escRegex(`${name}.weaponAttack`), `${name}.combat.stats.weaponAttack`);
    // Unknown - weaponPerk
    text = replace(text, escRegex(`${name}.weaponValue`), `${name}.inventory.weapon.value`);

    text = replace(text, escRegex(`${name}.armorName`), `${name}.inventory.armor.displayName`);
    text = replace(text, escRegex(`${name}.armorVerb`), `${name}.inventory.armor.verb`);
    // This is for the calcuated defense, not armor defense
    // Manual - assignment
    text = replace(text, escRegex(`${name}.armorDef`), `${name}.combat.stats.defense`);
    // Unknown - armorPerk
    text = replace(text, escRegex(`${name}.armorValue`), `${name}.inventory.armor.value`);

    text = replace(text, escRegex(`${name}.str`), `${name}.stats.str`);
    text = replace(text, escRegex(`${name}.tou`), `${name}.stats.tou`);
    text = replace(text, escRegex(`${name}.spe`), `${name}.stats.spe`);
    text = replace(text, escRegex(`${name}.inte`), `${name}.stats.int`);
    text = replace(text, escRegex(`${name}.lib`), `${name}.stats.lib`);
    text = replace(text, escRegex(`${name}.sens`), `${name}.stats.sens`);
    text = replace(text, escRegex(`${name}.cor`), `${name}.stats.cor`);
    text = replace(text, escRegex(`${name}.fatigue`), `${name}.stats.fatigue`);

    text = replace(text, escRegex(`${name}.HP`), `${name}.stats.HP`);
    text = replace(text, escRegex(`${name}.lust`), `${name}.stats.lust`);

    text = replace(text, escRegex(`${name}.XP`), `${name}.stats.XP`);
    text = replace(text, escRegex(`${name}.level`), `${name}.stats.level`);
    text = replace(text, escRegex(`${name}.gems`), `${name}.inventory.gems`);
    text = replace(text, escRegex(`${name}.additionalXP`), `${name}.stats.additionalXP`);

    // OK - gender
    text = replace(text, escRegex(`${name}.tallness`), `${name}.body.tallness`);

    text = replace(text, escRegex(`${name}.hairType`), `${name}.body.hair.type`);
    text = replace(text, escRegex(`${name}.hairColor`), `${name}.body.hair.color`);
    text = replace(text, escRegex(`${name}.hairLength`), `${name}.body.hair.length`);

    text = replace(text, escRegex(`${name}.skinType`), `${name}.body.skin.type`);
    text = replace(text, escRegex(`${name}.skinTone`), `${name}.body.skin.tone`);
    text = replace(text, escRegex(`${name}.skinDesc`), `${name}.body.skin.desc`);
    text = replace(text, escRegex(`${name}.skinAdj`), `${name}.body.skin.adj`);

    text = replace(text, escRegex(`${name}.faceType`), `${name}.body.face.type`);

    text = replace(text, escRegex(`${name}.earType`), `${name}.body.ear.type`);
    text = replace(text, escRegex(`${name}.earValue`), `${name}.body.ear.value`);

    text = replace(text, escRegex(`${name}.hornType`), `${name}.body.horns.type`);
    text = replace(text, escRegex(`${name}.horns`), `${name}.body.horns.count`);

    text = replace(text, escRegex(`${name}.wingType`), `${name}.body.wings.type`);
    text = replace(text, escRegex(`${name}.wingDesc`), `${name}.body.wings.desc`);

    text = replace(text, escRegex(`${name}.lowerBody`), `${name}.body.legs.type`);

    text = replace(text, escRegex(`${name}.tailType`), `${name}.body.tail.type`);
    text = replace(text, escRegex(`${name}.tailVenom`), `${name}.body.tail.venom`);
    text = replace(text, escRegex(`${name}.tailRecharge`), `${name}.body.tail.recharge`);

    text = replace(text, escRegex(`${name}.hipRating`), `${name}.body.hips.rating`);
    text = replace(text, escRegex(`${name}.buttRating`), `${name}.body.butt.rating`);

    // Manual - nipplesPierced
    // Manual - nipplesPShort
    // Manual - nipplesPLong
    text = replace(text, escRegex(`${name}.lipPierced`), `${name}.inventory.piercings.lip.isEquiped()`);
    text = replace(text, escRegex(`${name}.lipPShort`), `${name}.inventory.piercings.lip.item.shortDesc`);
    text = replace(text, escRegex(`${name}.lipPLong`), `${name}.inventory.piercings.lip.item.longDesc`);
    text = replace(text, escRegex(`${name}.tonguePierced`), `${name}.inventory.piercings.tongue.isEquipped()`);
    text = replace(text, escRegex(`${name}.tonguePShort`), `${name}.inventory.piercings.tongue.item.shortDesc`);
    text = replace(text, escRegex(`${name}.tonguePLong`), `${name}.inventory.piercings.tongue.item.longDesc`);
    text = replace(text, escRegex(`${name}.eyebrowPierced`), `${name}.inventory.piercings.eyebrow.isEquipped()`);
    text = replace(text, escRegex(`${name}.eyebrowPShort`), `${name}.inventory.piercings.eyebrow.item.shortDesc`);
    text = replace(text, escRegex(`${name}.eyebrowPLong`), `${name}.inventory.piercings.eyebrow.item.longDesc`);
    text = replace(text, escRegex(`${name}.earsPierced`), `${name}.inventory.piercings.isEquipped()`);
    text = replace(text, escRegex(`${name}.earsPShort`), `${name}.inventory.piercings.item.shortDesc`);
    text = replace(text, escRegex(`${name}.earsPLong`), `${name}.inventory.piercings.item.longDesc`);
    text = replace(text, escRegex(`${name}.nosePierced`), `${name}.inventory.piercings.isEquipped()`);
    text = replace(text, escRegex(`${name}.nosePShort`), `${name}.inventory.piercings.item.shortDesc`);
    text = replace(text, escRegex(`${name}.nosePLong`), `${name}.inventory.piercings.item.longDesc`);
    text = replace(text, combineStrRegex(name, /\.vaginas\[([^\]]+)\]\.labiaPierced/g), `${name}.inventory.piercings.labia.isEquipped()`);
    text = replace(text, combineStrRegex(name, /\.vaginas\[([^\]]+)\]\.labiaPShort/g), `${name}.inventory.piercings.labia.item.shortDesc`);
    text = replace(text, combineStrRegex(name, /\.vaginas\[([^\]]+)\]\.labiaPLong/g), `${name}.inventory.piercings.labia.item.longDesc`);
    text = replace(text, combineStrRegex(name, /\.vaginas\[([^\]]+)\]\.clitPierced/g), `${name}.inventory.piercings.clit.isEquipped()`);
    text = replace(text, combineStrRegex(name, /\.vaginas\[([^\]]+)\]\.clitPShort/g), `${name}.inventory.piercings.clit.item.shortDesc`);
    text = replace(text, combineStrRegex(name, /\.vaginas\[([^\]]+)\]\.clitPLong/g), `${name}.inventory.piercings.clit.item.longDesc`);
    text = replace(text, combineStrRegex(name, /\.cocks\[([^\]]+)\]\.isPierced/g), (match, p1) => `${name}.inventory.piercings.cocks.get(${p1}).isEquipped()`);
    text = replace(text, combineStrRegex(name, /\.cocks\[([^\]]+)\]\.pShortDesc/g), (match, p1) => `${name}.inventory.piercings.cocks.get(${p1}).item.shortDesc`);
    text = replace(text, combineStrRegex(name, /\.cocks\[([^\]]+)\]\.pLongDesc/g), (match, p1) => `${name}.inventory.piercings.cocks.get(${p1}).item.longDesc`);

    text = replace(text, escRegex(`${name}.antennae`), `${name}.body.antennae.type`);
    text = replace(text, escRegex(`${name}.eyeType`), `${name}.body.eyes.type`);
    text = replace(text, escRegex(`${name}.tongueType`), `${name}.body.tongue.type`);
    text = replace(text, escRegex(`${name}.armType`), `${name}.body.arms.type`);
    text = replace(text, escRegex(`${name}.gills`), `${name}.body.gills`);
    text = replace(text, escRegex(`${name}.cocks`), `${name}.body.cocks`);
    text = replace(text, combineStrRegex(name, /\.balls(\W)/g), (match, p1) => `${name}.body.balls.count${p1}`);
    text = replace(text, escRegex(`${name}.cumMultiplier`), `${name}.body.cumMultiplier`);
    text = replace(text, escRegex(`${name}.ballSize`), `${name}.body.balls.size`);
    // OK - hoursSinceCum
    text = replace(text, escRegex(`${name}.vaginas`), `${name}.body.vaginas`);
    text = replace(text, escRegex(`${name}.fertility`), `${name}.body.fertility`);
    text = replace(text, escRegex(`${name}.clitLength`), `${name}.body.clit.length`);
    // Manual - nippleLength
    text = replace(text, escRegex(`${name}.breastRows`), `${name}.body.chest`);
    text = replace(text, combineStrRegex(name, /\.ass([^\w])/g), (match, p1) => `${name}.body.butt${p1} `);
    // Unused - perk()
    // Unused - perks()
    text = replace(text, escRegex(`${name}.numPerks`), `${name}.effects.length`);
    text = replace(text, escRegex(`${name}.statusAffects`), `${name}.effects`);

    // OK - orgasm()
    text = replace(text, escRegex(`${name}.createPerk`), `${name}.effects.create`);
    text = replace(text, escRegex(`${name}.removePerk`), `${name}.effects.removeByName`);
    text = funcReplacer(text, name + '.findPerk(', /\)(?:\s*([!><=]+)\s*([-\d]+))?/,
        (match, item, compOp, compVal) => {
            if (compOp && compOp.match(/<=?|==/) && +compVal <= 0)
                return `!${name}.effects.has(${item})`;
            return `${name}.effects.has(${item})`;
        });
    // Unused - perkDuplicated
    // Unused - removePerks
    text = funcReplacer(text, name + '.addPerkValue(', ')', (match, type, index, arg) => `${name}.effects.getByName(${type}).value${index} += ${arg} `);
    text = funcReplacer(text, name + '.setPerkValue(', ')', (match, type, index, arg) => `${name}.effects.getByName(${type}).value${index} = ${arg} `);
    text = funcReplacer(text, combineStrRegex(name, /\.perkv([1-4])\(/), ')', (match, index, type) => `${name}.effects.getByName(${type}).value${index} `);

    text = replace(text, escRegex(`${name}.createStatusAffect`), `${name}.effects.create`);
    text = replace(text, escRegex(`${name}.removeStatusAffect`), `${name}.effects.removeByName`);
    text = funcReplacer(text, name + '.findStatusAffect(', /\)(?:\s*([!><=]+)\s*([-\d]+))?/,
        (match, item, compOp, compVal) => {
            if (compOp && compOp.match(/<=?|==/) && +compVal <= 0)
                return `!${name}.effects.has(${item})`;
            return `${name}.effects.has(${item})`;
        });
    text = funcReplacer(text, name + '.changeStatusValue(', ')', (match, type, index, arg) => `${name}.effects.getByName(${type}).value${index} = ${arg} `);
    text = funcReplacer(text, name + '.addStatusValue(', ')', (match, type, index, arg) => `${name}.effects.getByName(${type}).value${index} += ${arg} `);
    text = funcReplacer(text, name + '.statusAffect(', ')', (match, type) => `${name}.effects.getByName(${type})`);
    text = funcReplacer(text, combineStrRegex(name, /\.statusAffectv([1-4])\(/), ')', (match, index, type) => `${name}.effects.getByName(${type}).value${index}`);
    // Unused - removeStatuses
    text = replace(text, escRegex(`${name}.biggestTitSize()`), `${name}.body.chest.sort(BreastRow.Largest).get(0).rating`);
    text = funcReplacer(text, name + '.cockArea(', ')', (match, index) => `${name}.body.cocks.get(${index}).area`);
    text = replace(text, escRegex(`${name}.biggestCockLength()`), `${name}.body.cocks.sort(Cock.Largest).get(0).length`);
    text = replace(text, escRegex(`${name}.biggestCockArea()`), `${name}.body.cocks.sort(Cock.Largest).get(0).area`);
    text = replace(text, escRegex(`${name}.biggestCockArea2()`), `${name}.body.cocks.sort(Cock.Largest).get(1).area`);
    text = replace(text, escRegex(`${name}.cocks[${name}.longestCock()]`), `${name}.body.cocks.sort(Cock.Longest).get(0)`);
    text = replace(text, escRegex(`${name}.longestCock()`), `${name}.body.cocks.sort(Cock.Longest).get(0)`);
    text = replace(text, escRegex(`${name}.longestCockLength()`), `${name}.body.cocks.sort(Cock.Longest).get(0).length`);
    text = replace(text, escRegex(`${name}.longestHorseCockLength()`), `${name}.body.cocks.filter(Cock.FilterType(CockType.HORSE)).sort(Cock.Longest).get(0).length`);
    // Unknown - twoDickRadarSpecial()
    text = replace(text, escRegex(`${name}.totalCockThickness()`), `${name}.body.cocks.reduce(Cock.TotalThickness, 0)`);
    text = replace(text, escRegex(`${name}.cocks[${name}.thickestCock()]`), `${name}.body.cocks.sort(Cock.Thickest).get(0)`);
    text = replace(text, escRegex(`${name}.thickestCock()`), `${name}.body.cocks.sort(Cock.Thickest).get(0)`);
    text = replace(text, escRegex(`${name}.thickestCockThickness()`), `${name}.body.cocks.sort(Cock.Thickest).get(0).thickness`);
    text = replace(text, escRegex(`${name}.cocks[${name}.thinnestCockIndex()]`), `${name}.body.cocks.sort(Cock.Thinnest).get(0)`);
    text = replace(text, escRegex(`${name}.thinnestCockIndex()`), `${name}.body.cocks.sort(Cock.Thinnest).get(0)`);
    text = replace(text, escRegex(`${name}.cocks[${name}.smallestCockIndex()]`), `${name}.body.cocks.sort(Cock.Smallest).get(0)`);
    text = replace(text, escRegex(`${name}.smallestCockIndex()`), `${name}.body.cocks.sort(Cock.Smallest).get(0)`);
    text = replace(text, escRegex(`${name}.smallestCockLength()`), `${name}.body.cocks.sort(Cock.Smallest).get(0).length`);
    text = replace(text, escRegex(`${name}.cocks[${name}.shortestCockIndex()]`), `${name}.body.cocks.sort(Cock.Shortest).get(0)`);
    text = replace(text, escRegex(`${name}.shortestCockIndex()`), `${name}.body.cocks.sort(Cock.Shortest).get(0)`);
    text = replace(text, escRegex(`${name}.shortestCockLength()`), `${name}.body.cocks.sort(Cock.Shortest).get(0).length`);
    text = funcReplacer(text,
        combineStrRegex(name, /\.cockThatFits(2?)\(/), /\)(?:\s*([!><=]+)\s*([-\d]+))?/,
        (match, second, arg1, arg2, compOp, compVal) => {
            let str = '';
            if (compOp && compOp.match(/<=?|==/) && +compVal <= 0)
                str += '!';

            if (second)
                str += name + '.body.cocks.filter(Cock.CocksThatFit';
            else
                str += name + '.body.cocks.find(Cock.CockThatFits';

            if (arg2 === "length")
                str += 'Length';

            str += '(' + arg1 + '))';

            if (second)
                str += '.get(1)';

            return str;
        }
    );
    text = replace(text, escRegex(`${name}.smallestCockArea()`), `${name}.body.cocks.sort(Cock.Smallest).get(0).area`);
    text = replace(text, escRegex(`${name}.cocks[${name}.smallestCock()]`), `${name}.body.cocks.sort(Cock.Smallest).get(0)`);
    text = replace(text, escRegex(`${name}.smallestCock()`), `${name}.body.cocks.sort(Cock.Smallest).get(0)`);
    text = replace(text, escRegex(`${name}.cocks[${name}.biggestCockIndex()]`), `${name}.body.cocks.sort(Cock.Largest).get(0)`);
    text = replace(text, escRegex(`${name}.biggestCockIndex()`), `${name}.body.cocks.sort(Cock.Largest).get(0)`);
    text = replace(text, escRegex(`${name}.cocks[${name}.biggestCockIndex2()]`), `${name}.body.cocks.sort(Cock.Largest).get(1)`);
    text = replace(text, escRegex(`${name}.biggestCockIndex2()`), `${name}.body.cocks.sort(Cock.Largest).get(1)`);
    text = replace(text, escRegex(`${name}.cocks[${name}.smallestCockIndex2()]`), `${name}.body.cocks.sort(Cock.Smallest).get(1)`);
    text = replace(text, escRegex(`${name}.smallestCockIndex2()`), `${name}.body.cocks.sort(Cock.Smallest).get(1)`);
    text = replace(text, escRegex(`${name}.cocks[${name}.biggestCockIndex3()]`), `${name}.body.cocks.sort(Cock.Largest).get(2)`);
    text = replace(text, escRegex(`${name}.biggestCockIndex3()`), `${name}.body.cocks.sort(Cock.Largest).get(2)`);
    text = replace(text, escRegex(`${name}.cockDescript()`), `describeCock(${name}, ${name}.body.cocks.get(0))`);
    text = funcReplacer(text, name + '.cockDescript(', ')',
        (match, arg) =>
            !isNaN(+arg) ?
                `describeCock(${name}, ${name}.body.cocks.get(${arg}))` :
                `describeCock(${name}, ${arg})`
    );
    text = funcReplacer(text, name + '.cockAdjective(', ')',
        (match, arg) =>
            arg ?
                `describeCockAdj(${name}, ${arg})` :
                `describeCockAdj(${name}, ${name}.body.cocks.get(0)`
    );
    text = replace(text, escRegex(`${name}.wetness()`), `${name}.body.vaginas.get(0).wetness`);
    // Manual - vaginaType()
    text = replace(text, escRegex(`${name}.looseness()`), `${name}.body.vaginas.get(0).looseness`);
    text = replace(text, escRegex(`${name}.looseness(true)`), `${name}.body.vaginas.get(0).looseness`);
    text = replace(text, escRegex(`${name}.looseness(false)`), `${name}.body.butt.looseness`);
    // OK - vaginalCapacity()
    // OK - analCapacity()
    text = replace(text, escRegex(`${name}.hasFuckableNipples()`), `${name}.body.chest.find(BreastRow.FuckableNipples)`);
    text = replace(text, escRegex(`!${name}.hasBreasts()`), `${name}.body.chest.length <= 0`);
    text = replace(text, escRegex(`${name}.hasBreasts()`), `${name}.body.chest.length > 0`);
    // Unused - hasNipples()
    // OK - lactationSpeed()
    text = replace(text, escRegex(`${name}.dogScore()`), `dogRaceScore(${name})`);
    text = replace(text, escRegex(`${name}.foxScore()`), `foxRaceScore(${name})`);
    text = replace(text, escRegex(`${name}.biggestLactation()`), `${name}.body.chest.sort(BreastRow.LactationMost).get(0).lactationMultiplier`);
    // OK - milked()
    text = funcReplacer(text, name + '.boostLactation(', ')', (match, arg) => `boostLactation(${name}, ${arg})`);
    text = replace(text, escRegex(`${name}.averageLactation()`), `${name}.body.chest.reduce(BreastRow.AverageLactation, 0)`);
    // OK - virilityQ()
    // OK - cumQ()
    text = funcReplacer(text, name + '.countCocksOfType(', ')', (match, type) => `${name}.body.cocks.filter(Cock.FilterType(${type})).length`);
    text = replace(text, escRegex(`${name}.anemoneCocks()`), `${name}.body.cocks.filter(Cock.FilterType(CockType.ANEMONE)).length`);
    text = replace(text, escRegex(`${name}.catCocks()`), `${name}.body.cocks.filter(Cock.FilterType(CockType.CAT)).length`);
    text = replace(text, escRegex(`${name}.demonCocks()`), `${name}.body.cocks.filter(Cock.FilterType(CockType.DEMON)).length`);
    text = replace(text, escRegex(`${name}.displacerCocks()`), `${name}.body.cocks.filter(Cock.FilterType(CockType.DISPLACER)).length`);
    text = replace(text, escRegex(`${name}.dogCocks()`), `${name}.body.cocks.filter(Cock.FilterType(CockType.DOG)).length`);
    text = replace(text, escRegex(`${name}.dragonCocks()`), `${name}.body.cocks.filter(Cock.FilterType(CockType.DRAGON)).length`);
    text = replace(text, escRegex(`${name}.foxCocks()`), `${name}.body.cocks.filter(Cock.FilterType(CockType.FOX)).length`);
    text = replace(text, escRegex(`${name}.horseCocks()`), `${name}.body.cocks.filter(Cock.FilterType(CockType.HORSE)).length`);
    text = replace(text, escRegex(`${name}.kangaCocks()`), `${name}.body.cocks.filter(Cock.FilterType(CockType.KANGAROO)).length`);
    text = replace(text, escRegex(`${name}.lizardCocks()`), `${name}.body.cocks.filter(Cock.FilterType(CockType.LIZARD)).length`);
    text = replace(text, escRegex(`${name}.normalCocks()`), `${name}.body.cocks.filter(Cock.FilterType(CockType.HUMAN)).length`);
    text = replace(text, escRegex(`${name}.tentacleCocks()`), `${name}.body.cocks.filter(Cock.FilterType(CockType.TENTACLE)).length`);
    // Unused - findFirstCockType()
    // Unused - addHorseCock()
    text = replace(text, escRegex(`${name}.cockTotal()`), `${name}.body.cocks.length`);
    text = replace(text, escRegex(`${name}.totalCocks()`), `${name}.body.cocks.length`);
    text = replace(text, escRegex(`!${name}.hasCock()`), `${name}.body.cocks.length <= 0`);
    text = replace(text, escRegex(`${name}.hasCock()`), `${name}.body.cocks.length > 0`);
    // Manual - hasSockRoom()
    // Manual - hasSock()
    // Manual - countCockSocks()
    // OK - canAutoFellate()
    // OK - canFly()
    text = replace(text, escRegex(`!${name}.hasVagina()`), `${name}.body.vaginas.length <= 0`);
    text = replace(text, escRegex(`${name}.hasVagina()`), `${name}.body.vaginas.length > 0`);
    text = replace(text, escRegex(`${name}.hasVirginVagina()`), `${name}.body.vaginas.find(Vagina.Virgin)`);
    // Manual - genderText
    text = replace(text, escRegex(`${name}.manWoman()`), `manWoman(${name})`);
    text = replace(text, escRegex(`${name}.manWoman(true)`), `manWoman(${name}, true)`);
    text = replace(text, escRegex(`${name}.manWoman(false)`), `manWoman(${name}, false)`);
    text = replace(text, escRegex(`${name}.guyGirl()`), `guyGirl(${name})`);
    text = replace(text, escRegex(`${name}.guyGirl(true)`), `guyGirl(${name}, true)`);
    text = replace(text, escRegex(`${name}.guyGirl(false)`), `guyGirl(${name}, false)`);
    text = funcReplacer(text, name + '.mfn(', ')', (match, gender, male, female) => `mfn(${name}, ${gender}, ${male}, ${female})`);
    text = funcReplacer(text, name + '.mf(', ')', (match, male, female) => `mf(${name}, ${male}, ${female})`);
    text = replace(text, escRegex(`${name}.boyGirl()`), `boyGirl(${name})`);
    text = replace(text, escRegex(`${name}.boyGirl(true)`), `boyGirl(${name}, true)`);
    text = replace(text, escRegex(`${name}.boyGirl(false)`), `boyGirl(${name}, false)`);
    text = replace(text, escRegex(`${name}.heShe()`), `heShe(${name})`);
    text = replace(text, escRegex(`${name}.heShe(true)`), `heShe(${name}, true)`);
    text = replace(text, escRegex(`${name}.heShe(false)`), `heShe(${name}, false)`);
    text = replace(text, escRegex(`${name}.himHer()`), `himHer(${name})`);
    text = replace(text, escRegex(`${name}.himHer(true)`), `himHer(${name}, true)`);
    text = replace(text, escRegex(`${name}.himHer(false)`), `himHer(${name}, false)`);
    text = replace(text, escRegex(`${name}.maleFemale()`), `maleFemale(${name})`);
    text = replace(text, escRegex(`${name}.maleFemale(true)`), `maleFemale(${name}, true)`);
    text = replace(text, escRegex(`${name}.maleFemale(false)`), `maleFemale(${name}, false)`);
    text = replace(text, escRegex(`${name}.hisHer()`), `hisHer(${name})`);
    text = replace(text, escRegex(`${name}.hisHer(true)`), `hisHer(${name}, true)`);
    text = replace(text, escRegex(`${name}.hisHer(false)`), `hisHer(${name}, false)`);
    text = replace(text, escRegex(`${name}.sirMadam()`), `sirMadam(${name})`);
    text = replace(text, escRegex(`${name}.sirMadam(true)`), `sirMadam(${name}, true)`);
    text = replace(text, escRegex(`${name}.sirMadam(false)`), `sirMadam(${name}, false)`);
    text = funcReplacer(text, name + '.createCock(', ')', (match, ...args) => `${name}.body.cocks.add(new Cock(${args.join(', ')}))`);
    text = funcReplacer(text, name + '.createVagina(', ')', (match, ...args) => args.length !== 3 ? match : `${name}.body.vaginas.add(new Vagina(${args[1]}, ${args[2]}, ${args[0]}))`);
    // Manual - createVagina(virgin, vaginalWetness)
    // Manual - createVagina(virgin)
    text = replace(text, escRegex(`${name}.createVagina()`), `${name}.body.vaginas.add(new Vagina())`);
    // Manual - createBreastRow(size, nipplesPerBreast)
    text = funcReplacer(text, name + '.createBreastRow(', ')', (match, ...args) => `${name}.body.chest.add(new BreastRow(${args.join(', ')}))`);
    text = replace(text, escRegex(`${name}.createBreastRow()`), `${name}.body.chest.add(new BreastRow())`);
    // Remove - genderCheck
    text = replace(text, escRegex(`${name}.genderCheck(); `), '');
    text = funcReplacer(text, name + '.removeCock(', ')',
        (match, index, amt) => amt === '1' ?
            `${name}.body.cocks.remove(${index})` :
            trimLeft`for (let cockIndex = 0; cockIndex < ${amt}; cockIndex++)
                ${name}.body.cocks.remove(${index} + cockIndex)`
    );
    text = funcReplacer(text, name + '.removeVagina(', ')',
        (match, index, amt) => amt === '1' ?
            `${name}.body.vaginas.remove(${index})` :
            trimLeft`for (let vagIndex = 0; vagIndex < ${amt}; vagIndex++)
                ${name}.body.vaginas.remove(${index} + vagIndex)`
    );
    text = replace(text, escRegex(`${name}.removeVagina()`), `${name}.body.vaginas.remove(0)`);
    text = funcReplacer(text, name + '.removeBreastRow(', ')',
        (match, index, amt) => amt === '1' ?
            `${name}.body.chest.remove(${index})` :
            trimLeft`for (let breastRowIndex = 0; breastRowIndex < ${amt}; breastRowIndex++)
                ${name}.body.chest.remove(${index} + breastRowIndex)`
    );
    // Remove - fixFuckingCockTypesEnum
    text = funcReplacer(text, name + '.buttChangeNoDisplay(', ')', (match, amt) => `stretchButt(${name}, ${amt})`);
    text = funcReplacer(text, name + '.cuntChangeNoDisplay(', ')', (match, amt) => `stretchVagina(${name}, ${amt})`);
    text = replace(text, escRegex(`${name}.inHeat`), `${name}.effects.has(EffectType.Heat)`);
    text = replace(text, escRegex(`${name}.inRut`), `${name}.effects.has(EffectType.Rut)`);
    // OK - bonusFertility
    // OK - totalFertility
    text = replace(text, escRegex(`${name}.isBiped()`), `${name}.body.legs.isBiped()`);
    text = replace(text, escRegex(`${name}.isNaga()`), `${name}.body.legs.isNaga()`);
    text = replace(text, escRegex(`${name}.isTaur()`), `${name}.body.legs.isTaur()`);
    text = replace(text, escRegex(`${name}.isDrider()`), `${name}.body.legs.isDrider()`);
    text = replace(text, escRegex(`${name}.isGoo()`), `${name}.body.legs.isGoo()`);
    text = replace(text, escRegex(`${name}.legs()`), `describeLegs(${name})`);
    text = replace(text, escRegex(`${name}.skinFurScales()`), `skinFurScales(${name})`);
    text = replace(text, escRegex(`${name}.leg()`), `describeLeg(${name})`);
    text = replace(text, escRegex(`${name}.feet()`), `describeFeet(${name})`);
    text = replace(text, escRegex(`${name}.foot()`), `describeFoot(${name})`);
    // Manual - canOvipositSpider
    // Manual - canOvipositBee
    text = replace(text, escRegex(`${name}.canOviposit()`), `${name}.body.ovipositor.canOviposit()`);
    text = replace(text, escRegex(`${name}.eggs()`), `${name}.body.ovipositor.eggs`);
    // Unused - addEggs
    text = replace(text, escRegex(`${name}.dumpEggs()`), `${name}.body.ovipositor.dumpEggs()`);
    text = replace(text, escRegex(`${name}.dumpEggs()`), `${name}.body.ovipositor.dumpEggs()`);
    // Unused - setEggs
    text = replace(text, escRegex(`${name}.fertilizedEggs()`), `${name}.body.ovipositor.fertilizedEggs`);
    text = replace(text, escRegex(`${name}.fertilizeEggs()`), `${name}.body.ovipositor.fertilizeEggs()`);
    text = funcReplacer(text, name + '.breastCup(', ')', (match, index) => `breastCup(${name}.body.chest.get(${index}))`);
    text = replace(text, escRegex(`${name}.bRows()`), `${name}.body.chest.length`);
    text = replace(text, escRegex(`${name}.totalBreasts()`), `${name}.body.chest.reduce(BreastRow.TotalBreasts, 0)`);
    text = replace(text, escRegex(`${name}.totalNipples()`), `${name}.body.chest.reduce(BreastRow.TotalNipples, 0)`);
    text = replace(text, escRegex(`${name}.smallestTitSize()`), `${name}.body.chest.sort(BreastRow.Smallest).get(0).rating`);
    text = replace(text, escRegex(`${name}.smallestTitRow()`), `${name}.body.chest.sort(BreastRow.Smallest).get(0)`);
    text = replace(text, escRegex(`${name}.biggestTitRow()`), `${name}.body.chest.sort(BreastRow.Biggest).get(0)`);
    text = replace(text, escRegex(`${name}.averageBreastSize()`), `${name}.body.chest.reduce(BreastRow.AverageSize, 0)`);
    text = replace(text, escRegex(`${name}.averageCockThickness()`), `${name}.body.cocks.reduce(Cock.AverageThickness, 0)`);
    text = replace(text, escRegex(`${name}.averageNippleLength()`), `${name}.body.chest.reduce(BreastRow.AverageNippleLength, 0)`);
    text = replace(text, escRegex(`${name}.averageVaginalLooseness()`), `${name}.body.vaginas.reduce(Vagina.AverageLooseness, 0)`);
    text = replace(text, escRegex(`${name}.averageVaginalWetness()`), `${name}.body.vaginas.reduce(Vagina.AverageWetness, 0)`);
    text = replace(text, escRegex(`${name}.averageCockLength()`), `${name}.body.cocks.reduce(Cock.AverageLength, 0)`);
    text = replace(text, escRegex(`${name}.canTitFuck()`), `${name}.body.chest.find(BreastRow.CanTitFuck)`);
    text = replace(text, escRegex(`${name}.mostBreastsPerRow()`), `${name}.body.chest.sort(BreastRow.BreastsPerRowMost).get(0).count`);
    text = replace(text, escRegex(`${name}.averageNipplesPerBreast()`), `${name}.body.chest.reduce(BreastRow.AverageNipplesPerBreast, 0)`);
    text = replace(text, escRegex(`${name}.allBreastsDescript()`), `describeAllBreasts(${name})`);
    text = replace(text, escRegex(`${name}.sMultiCockDesc()`), `describeOneOfYourCocks(${name})`);
    text = replace(text, escRegex(`${name}.SMultiCockDesc()`), `describeOneOfYourCocksCap(${name})`);
    text = replace(text, escRegex(`${name}.oMultiCockDesc()`), `describeEachOfYourCocks(${name})`);
    text = replace(text, escRegex(`${name}.OMultiCockDesc()`), `describeEachOfYourCocksCap(${name})`);
    text = replace(text, escRegex(`${name}.cockMultiLDescriptionShort()`), `describeCocksShort(${name})`);
    text = replace(text, escRegex(`${name}.hasSheath()`), `${name}.body.cocks.find(Cock.HasSheath)`);
    text = replace(text, escRegex(`${name}.sheathDescription()`), `describeCockSheath(${name})`);
    text = replace(text, escRegex(`${name}.vaginaDescript()`), `describeVagina(${name}, ${name}.body.vaginas.get(0))`);
    text = funcReplacer(text, name + '.vaginaDescript(', ')', (match, index) => `describeVagina(${name}, ${name}.body.vaginas.get(${index}))`);
    text = funcReplacer(text, name + '.nippleDescript(', ')', (match, index) => `describeNipple(${name}, ${name}.body.chest.get(${index}))`);
    text = replace(text, escRegex(`${name}.chestDesc()`), `describeChest(${name})`);
    text = replace(text, escRegex(`${name}.allChestDesc()`), `describeAllChest(${name})`);
    text = replace(text, escRegex(`${name}.clitDescript()`), `describeClit(${name})`);
    text = replace(text, escRegex(`${name}.cockHead()`), `describeCockHead(${name}.body.cocks.get(0))`);
    text = funcReplacer(text, name + '.cockHead(', ')', (match, index) => `describeCockHead(${name}.body.cocks.get(${index}))`);
    text = replace(text, escRegex(`${name}.cockDescriptShort()`), `describeCockShort(${name}.body.cocks.get(0))`);
    text = funcReplacer(text, name + '.cockDescriptShort(', ')', (match, index) => `describeCockShort(${name}.body.cocks.get(${index}))`);
    text = replace(text, escRegex(`${name}.assholeOrPussy()`), `assholeOrPussy(${name})`);
    text = replace(text, escRegex(`${name}.multiCockDescriptLight()`), `describeCocksLight(${name})`);
    text = replace(text, escRegex(`${name}.multiCockDescript()`), `describeCocks(${name})`);
    text = replace(text, escRegex(`${name}.ballsDescriptLight()`), `describeBalls(true, true, ${name})`);
    text = replace(text, escRegex(`${name}.ballsDescriptLight(true)`), `describeBalls(true, true, ${name})`);
    text = replace(text, escRegex(`${name}.ballsDescriptLight(false)`), `describeBalls(false, true, ${name})`);
    text = replace(text, escRegex(`${name}.sackDescript()`), `describeSack(${name})`);
    text = funcReplacer(text, name + '.breastDescript(', ')', (match, index) => `describeBreastRow(${name}.body.chest.get(${index}))`);
    text = funcReplacer(text, name + '.breastSize(', ')', (match, size) => `describeBreastRowRating(${size})`);
    return text;
}
