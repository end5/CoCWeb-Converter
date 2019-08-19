import { applyTextChanges } from "../../src/TextChanger";

const test = applyTextChanges('0123456789', [{
    span: {
        start: 1,
        length: 2
    },
    newText: 'a'
}, {
    span: {
        start: 7,
        length: 1
    },
    newText: 'b'
}, {
    span: {
        start: 10,
        length: 0
    },
    newText: 'qwer'
}]);

console.log(test === '0a3456b89qwer' ? 'Success' : 'Fail');
