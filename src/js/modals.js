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
      data.push({
        id: id(),
        order: () => (Storage.getItems() ? Storage.getItems()
          .filter((item) => item.column === column).length + 1 : 1),
        column,
        name,
      });
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

  // eslint-disable-next-line consistent-return
  static renderFiles(modal, file, fileTypes) {
    // Передали не то окно - отмена
    if (!modal.classList.contains('modal-add-update')) {
      return null;
    }
    // Тип файла не поддерживается - отмена
    if (!fileTypes.find((fileType) => fileType === file.type)) {
      alert('This file type is not supported');
      return null;
    }
    const fileElement = document.createElement('li');
    fileElement.classList.add('file-element');
    fileElement.setAttribute('data-time', `${file.lastModified}`);
    const svg = '<svg class="file-remove" viewBox="0 0 329.26933 329" xmlns="http://www.w3.org/2000/svg">'
      + '<path d="m194.800781 164.769531 128.210938-128.214843c8.34375-8.339844 8.34375-21.824219 '
      + '0-30.164063-8.339844-8.339844-21.824219-8.339844-30.164063 0l-128.214844 128.214844-128.2109'
      + '37-128.214844c-8.34375-8.339844-21.824219-8.339844-30.164063 0-8.34375 8.339844-8.34375 21.8'
      + '24219 0 30.164063l128.210938 128.214843-128.210938 128.214844c-8.34375 8.339844-8.34375 21.8'
      + '24219 0 30.164063 4.15625 4.160156 9.621094 6.25 15.082032 6.25 5.460937 0 10.921875-2.0898'
      + '44 15.082031-6.25l128.210937-128.214844 128.214844 128.214844c4.160156 4.160156 9.621094 6.2'
      + '5 15.082032 6.25 5.460937 0 10.921874-2.089844 15.082031-6.25 8.34375-8.339844 8.34375-21.82'
      + '4219 0-30.164063zm0 0"/></svg>';
    const link = URL.createObjectURL(file);
    const fileType = Array.from(file.name)
      .slice(file.name.length - Array.from(file.name).reverse()
        .findIndex((item) => item === '.') - 1).join('');
    let previewItem;
    if (!file.type.includes('image')) {
      // Если не картинка
      previewItem = document.createElement('div');
      previewItem.textContent = fileType;
      previewItem.classList.add('preview');
    } else {
      // Если картинка
      previewItem = document.createElement('img');
      previewItem.src = link;
      previewItem.alt = file.name;
      previewItem.classList.add('preview-image');
    }
    previewItem.title = file.name;
    fileElement.appendChild(previewItem);
    fileElement.insertAdjacentHTML('beforeend', svg);
    modal.querySelector('.files').appendChild(fileElement);
    setTimeout(() => URL.revokeObjectURL(link), 60000);
  }

  static reset() {
    document.forms['add-and-update'].reset();
  }
}
