/* eslint-disable import/no-cycle, no-param-reassign */
import id from 'uniqid';
import Storage from './storage';
import Utils from './utils';

export default class Modals {
  // Функция отображения модельного окна
  static show(modal, row, target, list, filesToSave) {
    // Если в ячейке файл, помещаем копию контейнера в окно
    if (target && target.closest('li.file-element')) {
      const fileNode = target.closest('li.file-element').querySelector('.preview, .preview-image').cloneNode(true);
      fileNode.id = 'preview-for-download';
      modal.querySelector('.modal-file-container').insertAdjacentElement('afterbegin', fileNode);
    }
    if (target && target.classList.contains('new')) {
      this.column = target.closest('.column').querySelector('.column-container').id;
    }
    const input = row ? modal.querySelector('#description') : 0;
    if (row) {
      input.value = row.querySelector('.column-item-title').textContent;
    }
    console.log(input);
    if (list && row) {
      const filesToRender = list.find((item) => item.id === row.getAttribute('data-id')).files;
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
    } else {
      const descriptionInput = modal.querySelector('#description');
      if (descriptionInput) {
        descriptionInput.focus();
      }
    }
    return [];
  }

  // Функция сохранения: отправка данных на сервер
  static async save(modal, button, column, rowId, filesToSave, list, quota) {
    const name = modal.querySelector('#description').value.trim();
    if (rowId) {
      const target = list.find((item) => item.id.toString() === rowId);
      target.name = name;
      target.files = filesToSave;
      try {
        await Utils.checkSize(quota, JSON.stringify(list));
        await Storage.request('update', JSON.stringify({ id: rowId, name, files: filesToSave }));
      } catch (error) {
        return { error };
      }
    } else {
      if (!list) {
        list = [];
      }
      const order = () => (list ? list.filter((item) => item.column === column).length + 1 : 1);
      const newbie = {
        id: id(), order: order(), column, name, files: filesToSave,
      };
      list.push(newbie);
      await Storage.request('new', JSON.stringify(newbie));
    }
    return Modals.cancel();
  }

  // Функция удаления ячейки
  static async delete(rowId, list) {
    list.splice(list.findIndex((item) => item.id === rowId), 1);
    await Storage.request('delete', JSON.stringify({ id: rowId }));
    Modals.cancel();
  }

  // Функция закрытия окна
  static cancel() {
    Utils.reset();
    document.querySelector('#description').style.borderColor = '';
    document.querySelector('button.save').disabled = true;
    document.querySelectorAll('.error').forEach((message) => message.classList.add('hidden'));
    Array.from(document.querySelectorAll('.modal-container')).find((modal) => !modal.classList.contains('hidden'))?.classList.add('hidden');
    return [];
  }
}
