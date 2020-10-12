/* eslint-disable no-param-reassign */
export default function validation(input) {
  // Функция проверки поля на валидность
  const message = input.nextElementSibling;
  if (!input.validity.valid || !input.value.trim()) {
    if (input.validity.valueMissing) {
      message.textContent = 'Enter the name, please.';
    } else {
      message.textContent = 'This value is invalid.';
    }
    message.classList.remove('hidden');
    input.style.borderColor = 'crimson';
    return false;
  }
  message.classList.add('hidden');
  input.style.borderColor = '';
  return true;
}
