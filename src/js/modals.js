/* eslint-disable import/no-cycle */
import id from 'uniqid';
import Storage from './storage';
import App from './app';
import Utils from './utils';

export default class Modals {
  // Функция отображения модельного окна
  static show(modal, row, target, filesToSave) {
    // Если в ячейке файл, помещаем копию контейнера в окно
    if (target && target.closest('li.file-element')) {
      const fileNode = target.closest('li.file-element').querySelector('.preview, .preview-image').cloneNode(true);
      fileNode.id = 'preview-for-download';
      modal.querySelector('.modal-file-container').insertAdjacentElement('afterbegin', fileNode);
    }
    if (target && target.classList.contains('new')) {
      this.column = target.previousElementSibling.id;
    }
    const input = row ? modal.querySelector('#description') : 0;
    if (row) {
      input.value = row.querySelector('.column-item-title').textContent;
    }
    const items = Storage.getItems();
    if (items && row) {
      const filesToRender = items.find((item) => item.id === row.getAttribute('data-id')).files;
      // Отрисовываем файлы
      if (filesToRender && filesToRender.length) {
        filesToRender.forEach(
          (file) => Utils.makeFile(file)
            .then((result) => Utils.readFile(result))
            .then((result) => {
              filesToSave.push(result);
              Utils.renderFiles(modal, result);
            })
            .then(() => {
              modal.classList.remove('hidden');
              if (input) {
                input.focus();
              }
            }),
        );
        return filesToSave;
      }
    }
    if (modal) {
      modal.classList.remove('hidden');
    }
    if (input) {
      input.focus();
    }
    return [];
  }

  // Функция сохранения: отправка данных в localStorage
  static save(modal, button, column, row, filesToSave) {
    const name = modal.querySelector('#description').value.trim();
    let data = Storage.getItems();
    if (row) {
      const target = data.find((item) => item.id.toString() === row.getAttribute('data-id'));
      target.name = name;
      target.files = filesToSave;
    } else {
      if (!data) {
        data = [];
      }
      const order = () => (Storage.getItems() ? Storage.getItems()
        .filter((item) => item.column === column).length + 1 : 1);
      data.push({
        id: id(),
        order: order(),
        column,
        name,
        files: filesToSave,
      });
    }
    Storage.setItems(data);
    App.update();
    return Modals.cancel();
  }

  // Функция удаления ячейки
  static delete(row) {
    const data = () => Storage.getItems().filter((item) => item.id.toString() !== row.getAttribute('data-id'))
      .map((item) => {
        if (item.column === row.closest('.column-container').id && parseInt(item.order, 10) > parseInt(row.getAttribute('data-order'), 10)) {
          // eslint-disable-next-line no-param-reassign
          item.order = parseInt(item.order, 10) - 1;
        }
        return item;
      });
    Storage.setItems(data());
    App.update();
    Modals.cancel();
  }

  // Функция закрытия окна
  static cancel() {
    App.reset();
    document.querySelector('#description').style.borderColor = '';
    document.querySelector('button.save').disabled = true;
    document.querySelectorAll('.error').forEach((message) => message.classList.add('hidden'));
    Array.from(document.querySelectorAll('.modal-container')).find((modal) => !modal.classList.contains('hidden')).classList.add('hidden');
    return [];
  }
}
