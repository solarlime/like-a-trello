/* eslint-disable import/no-cycle */
import id from 'uniqid';
import Storage from './storage';
import App from './app';

export default class Modals {
  static show(modal, row, target) {
    if (target && target.classList.contains('new')) {
      this.column = target.previousElementSibling.id;
    }
    const input = modal.querySelector('#description');
    if (row) {
      input.value = row.querySelector('.column-item-title').textContent;
    }
    modal.classList.remove('hidden');
    if (input) {
      input.focus();
    }
  }

  static save(modal, button, column, row) {
    const name = modal.querySelector('#description').value.trim();
    let data = Storage.getItems();
    if (row) {
      const target = data.find((item) => item.id.toString() === row.getAttribute('data-id'));
      target.name = name;
    } else {
      if (!data) {
        data = [];
      }
      data.push({ id: id(), column, name });
    }
    Storage.setItems(data);
    App.update();
    Modals.cancel();
  }

  static delete(row) {
    Storage.setItems(
      // помещаем обратно в localStorage ту его часть, которая не совпадает по id с data-id
      Storage.getItems().filter((item) => item.id.toString() !== row.getAttribute('data-id')),
    );
    App.update();
    Modals.cancel();
  }

  static cancel() {
    Modals.reset();
    document.querySelector('button.save').disabled = true;
    document.querySelectorAll('.error').forEach((message) => message.classList.add('hidden'));
    Array.from(document.querySelectorAll('.modal-container')).find((modal) => !modal.classList.contains('hidden')).classList.add('hidden');
  }

  static reset() {
    document.forms['add-and-update'].reset();
  }
}
