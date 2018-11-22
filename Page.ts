import { fixText } from "./Converter";

const right = document.createElement('textarea');
const left = document.createElement('textarea');

document.body.style.backgroundColor = "#3C4556";
left.style.width = "48%";
left.style.height = "90%";
left.style.position = "absolute";
left.style.backgroundColor = "#3C4556";
left.style.color = "#f2f2f2";
right.style.width = "48%";
right.style.height = "90%";
right.style.position = "absolute";
right.style.backgroundColor = "#3C4556";
right.style.color = "#f2f2f2";
right.style.left = "50%";

left.addEventListener('input', () => {
    // console.log(left.value);
    if (left.value)
        right.value = fixText(left.value);
});

document.body.appendChild(left);
document.body.appendChild(right);
