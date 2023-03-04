/* eslint-disable import/no-cycle, no-unused-expressions, no-param-reassign */
import Modals from './modals';
import validation from './validation';
import MoveItems from './moveItems';
import Utils from './utils';
import Storage from './storage';

export default class Page {
  constructor() {
    this.page = document.body;
    this.main = this.page.querySelector('main');
    this.board = this.page.querySelector('.board');
    this.pluses = this.page.querySelectorAll('.new');
    this.modalAddUpdate = this.page.querySelector('.modal-add-update');
    this.modalDelete = this.page.querySelector('.modal-delete');
    this.modalError = this.page.querySelector('.modal-error');
    this.dancer = this.page.querySelector('.modal-dancer');
    this.modalFile = this.page.querySelector('.modal-file');
    this.form = this.page.querySelector('form#add-and-update');
    this.cancels = this.page.querySelectorAll('button.cancel');
    this.save = this.page.querySelector('button.save');
    this.delete = this.page.querySelector('button.delete');
    this.download = this.page.querySelector('button.download');
    this.fileChooser = this.page.querySelector('input#file');
    this.fakeFile = this.page.querySelector('.fake-file');
    this.scrolls = this.page.querySelectorAll('.scrolls');
    this.lime = this.page.querySelector('svg.lime');
    this.info = this.page.querySelector('svg.info');
    this.column = 'todo';
    this.drag = null;
    // "Дельта" - разница между курсором и левым верхним углом
    // перетаскиваемого элемента. Понадобится при Drag and Drop
    this.delta = { x: 0, y: 0 };
    this.save.disabled = true;
    this.files = [];
    this.filesToSave = [];
    this.scroll = false;
    this.quotaForFiles = 5000000; // <5 MB due to serverless limits.
  }

  /**
   * Добавляем обработчик события на кнопку. В случае наличия
   * подсказки удаляем её, иначе - отрисовываем.
   */
  addListeners() {
    // Функция для управляющих кнопок
    function actionsButtons(event) {
      // event.target - не всегда <svg>: иногда <path>. Поправляем
      const svg = Utils.getSVG(event.target);
      if (svg.tagName !== 'svg') return null;
      if (svg.classList.value === 'column-item-actions-update') {
        this.targetRow = svg.closest('li');
        this.filesToSave = Modals.show(
          this.modalAddUpdate,
          this.targetRow,
          event.target,
          this.list.data,
          this.filesToSave,
        );
      }
      if (svg.classList.value === 'column-item-actions-delete') {
        this.targetRow = svg.closest('li');
        this.filesToSave = Modals.show(this.modalDelete);
      }
      return 1;
    }

    // Обработчик изменения размера экрана. В какой-то мере решает проблему 100vh.
    // Спасибо Louis Hoebregts (@mamboleoo) за идею
    window.addEventListener('resize', () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    });

    window.dispatchEvent(new Event('resize'));
    window.oncontextmenu = () => false;

    // Обработчики для боковых скроллов
    ['mousemove', 'touchmove'].forEach((eventType) => this.page.addEventListener(eventType, (event) => {
      const eventResolved = Utils.eventResolver(event);
      const elements = document.elementsFromPoint(eventResolved.clientX, eventResolved.clientY);
      const scroll = elements.find((item) => item.classList.contains('scrolls'));
      if (this.drag && scroll) {
        if (scroll.classList.contains('scroll-left')) {
          this.main.scrollLeft -= 20;
        } else {
          this.main.scrollLeft += 20;
        }
      }
    }));

    // Обработчики для кнопок 'Add new item'
    this.pluses.forEach((plus) => {
      ['mouseup', 'touchend'].forEach((eventType) => plus.addEventListener(eventType, (event) => {
        this.targetRow = 0;
        this.filesToSave = Modals.show.call(
          this,
          this.modalAddUpdate,
          this.targetRow,
          event.target,
          this.list.data,
          this.filesToSave,
        );
      }));
    });

    // Обработчики нажатий на файлы и управляющие кнопки
    ['mousedown', 'touchstart'].forEach((eventType) => this.board.addEventListener(eventType, (event) => {
      event.preventDefault();
      const eventResolved = Utils.eventResolver(event);
      this.touchStartPoint = { x: eventResolved.pageX, y: eventResolved.pageY };
      this.touch = true;
    }));

    ['mouseup', 'touchend'].forEach((eventType) => this.board.addEventListener(eventType, (event) => {
      event.preventDefault();
      if (this.touch) {
        const eventResolved = Utils.eventResolver(event);
        this.touchEndPoint = { x: eventResolved.pageX, y: eventResolved.pageY };
        if ((this.touchStartPoint.x === this.touchEndPoint.x)
          && (this.touchStartPoint.y === this.touchEndPoint.y)) {
          if (event.target.closest('.file-element')) {
            Modals.show(this.modalFile, 0, event.target);
          }
          if (event.target.closest('.column-item-actions')) {
            actionsButtons.call(this, event);
          }
        }
      }
      this.touch = false;
    }));

    // Обработчики для кнопок Cancel
    this.cancels.forEach((cancel) => {
      ['mouseup', 'touchend'].forEach((eventType) => cancel.addEventListener(eventType, (event) => {
        event.preventDefault();
        this.filesToSave = Modals.cancel();
      }));
    });

    // Обработчик проверки поля ввода на валидность
    this.form.querySelector('#description').addEventListener('input', (event) => {
      this.save.disabled = !validation(event.target);
    });

    // Обработчики кнопки 'Save'
    ['mouseup', 'touchend'].forEach((eventType) => this.save.addEventListener(eventType, async (event) => {
      event.preventDefault();
      this.dancer.classList.remove('hidden');
      const awaiter = await Modals.save(this.modalAddUpdate, event.target, this.column, this.targetRow ? this.targetRow.getAttribute('data-id') : 0, this.filesToSave, this.list.data, this.quotaForFiles);
      if (awaiter.error) {
        this.dancer.classList.add('hidden');
        Modals.cancel();
        this.modalError.querySelector('#error-message').textContent = awaiter.error.message;
        Modals.show(this.modalError);
        const timeout = setTimeout(async () => {
          Modals.cancel();
          await this.update(true);
          clearTimeout(timeout);
        }, 5000);
      } else {
        this.filesToSave = awaiter;
        await this.update();
      }
    }));

    // Обработчики кнопки 'Download'
    ['mouseup', 'touchend'].forEach((eventType) => this.download.addEventListener(eventType, (event) => {
      event.preventDefault();
      this.download.textContent = 'Wait...';
      this.download.disabled = true;
      event.target.blur();
      const files = this.list.data.flatMap((item) => item.files);
      const previewForDownload = this.page.querySelector('#preview-for-download');
      const fileItem = files.find((file) => file.name === previewForDownload.title);
      const url = document.createElement('a');
      url.download = fileItem.name;
      url.href = fileItem.link;
      url.rel = 'noopener';
      setTimeout(() => {
        url.dispatchEvent(new MouseEvent('click'));
        Modals.cancel();
        this.download.textContent = 'Download';
        this.download.disabled = false;
      }, 1000);
    }));

    // Обработчики кнопки 'Delete'
    ['mouseup', 'touchend'].forEach((eventType) => this.delete.addEventListener(eventType, async (event) => {
      event.preventDefault();
      this.dancer.classList.remove('hidden');
      await Modals.delete(this.targetRow.getAttribute('data-id'), this.list.data);
      await this.update();
    }));

    // Обработчики кнопки 'Info'
    ['mouseup', 'touchend'].forEach((eventType) => this.info.addEventListener(eventType, (event) => {
      event.preventDefault();
      this.modalError.querySelector('#error-message').textContent = 'Press and hold a cursor / finger on a chosen card\'s header for a couple of seconds to drag it!';
      Modals.show(this.modalError);
      const timeout = setTimeout(async () => {
        Modals.cancel();
        clearTimeout(timeout);
      }, 5000);
    }));

    // Обработчики кнопки 'Lime'
    ['mouseup', 'touchend'].forEach((eventType) => this.lime.addEventListener(eventType, (event) => {
      event.preventDefault();
      const container = this.modalError.querySelector('#error-message');
      container.textContent = '';
      const link = document.createElement('a');
      link.href = 'https://solarlime.dev';
      link.target = '_blank';
      link.textContent = 'solarlime';
      const heart = document.createElement('span');
      heart.style = 'color: #ffcf48;';
      heart.textContent = '♥';
      container.insertAdjacentElement('beforeend', link)
        .insertAdjacentElement('beforebegin', heart)
        .insertAdjacentText('afterend', ' by ');
      container.insertAdjacentText('afterbegin', 'Made with ');

      Modals.show(this.modalError);
      const timeout = setTimeout(async () => {
        Modals.cancel();
        clearTimeout(timeout);
      }, 5000);
    }));

    // Обработчик кнопки выбора файла
    this.fileChooser.addEventListener('change', (event) => {
      Utils.fileUploader(
        Array.from(event.target.files),
        this.filesToSave,
        this.modalAddUpdate,
        this.save,
      )
        .then(() => {
          this.save.disabled = !validation(event.target.closest('.modal').querySelector('#description'));
        });
    });

    function preventDefaults(event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Отменяем стандартное поведение браузера при нативном DnD. Спасибо @joezimjs
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
      this.fileChooser.addEventListener(eventName, preventDefaults, false);
      this.page.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach((eventName) => {
      this.fakeFile.addEventListener(eventName, () => {
        this.fakeFile.classList.add('fake-file-ondnd');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      this.fakeFile.addEventListener(eventName, () => {
        this.fakeFile.classList.remove('fake-file-ondnd');
      });
    });

    // Обработчик DnD файлов
    this.fakeFile.addEventListener('drop', (event) => {
      Utils.fileUploader(
        Array.from(event.dataTransfer.files),
        this.filesToSave,
        this.modalAddUpdate,
        this.save,
      )
        .then(() => {
          this.save.disabled = !validation(event.target.closest('.modal').querySelector('#description'));
        });
    });

    // Обработчики кнопок удаления файлов
    ['mouseup', 'touchend'].forEach((eventType) => this.modalAddUpdate.addEventListener(eventType, (event) => {
      const svg = Utils.getSVG(event.target);
      if (svg.tagName !== 'svg') return;
      this.filesToSave.splice(this.filesToSave
        .findIndex((item) => item.lastModified.toString() === svg.closest('li')
          .getAttribute('data-time')), 1);
      this.save.disabled = !validation(event.target.closest('.modal').querySelector('#description'));
      svg.closest('li').remove();
    }));

    // Обработчики захвата ячейки
    ['mousedown', 'touchstart'].forEach((eventType) => this.board.addEventListener(eventType, (event) => {
      const eventResolved = Utils.eventResolver(event);
      this.startTouchingTitle = { x: eventResolved.clientX, y: eventResolved.clientY };
      this.endTouchingTitle = { ...this.startTouchingTitle };
      this.drag = null;
      if (event.target.classList.contains('column-item-title')) {
        this.timeout = setTimeout(() => {
          if (this.endTouchingTitle
            // Палец может немного дёрнуться: проявляется в мобильных chrome-браузерах. Чиним
            && (Math.abs(this.startTouchingTitle.x - this.endTouchingTitle.x) < 5)
            && (Math.abs(this.startTouchingTitle.y - this.endTouchingTitle.y) < 5)) {
            this.drag = MoveItems.chooseItem(event, this.delta);
            Utils.renderSpace.call(this, eventResolved, this.drag, 1);
          } else {
            this.endTouchingTitle = undefined;
          }
          clearTimeout(this.timeout);
        }, 1000);
      }
      if (!this.drag) {
        // Начальная точка скроллинга
        this.scroll = true;
        this.startX = eventResolved.clientX + this.main.scrollLeft;
        this.columnToScroll = event.target.closest('ul');
        this.startY = eventResolved.clientY + this.columnToScroll.scrollTop;
      }
    }));

    // Обработчики перемещения ячейки
    ['mousemove', 'touchmove'].forEach((eventType) => this.board.addEventListener(eventType, (event) => {
      const eventResolved = Utils.eventResolver(event);
      // Конечная точка скроллинга
      this.endTouchingTitle = { x: eventResolved.clientX, y: eventResolved.clientY };

      function resolveScrolls(elements) {
        const divColumn = elements.find((item) => item.classList.contains('column'));
        if (!divColumn) {
          document.querySelectorAll('.scroll-block')
            .forEach((scroll) => { !scroll.classList.contains('hidden') ? scroll.classList.add('hidden') : 0; });
          return;
        }
        const column = divColumn.querySelector('ul.column-container');
        const scrollUp = divColumn.querySelector('.column-scroll-up');
        const scrollDown = divColumn.querySelector('.column-scroll-down');

        if (column.scrollTop === 0) {
          scrollUp.classList.add('hidden');
        } else {
          scrollUp.classList.remove('hidden');
        }
        if (column.scrollHeight - column.scrollTop === column.clientHeight) {
          scrollDown.classList.add('hidden');
        } else {
          scrollDown.classList.remove('hidden');
        }

        const scrollBlock = elements.find((item) => item.classList.contains('scroll-block'));
        if (scrollBlock) {
          if (scrollBlock.classList.contains('column-scroll-up')) {
            column.scrollTop -= 50;
          } else {
            column.scrollTop += 50;
          }
        }
      }

      if (!this.drag) {
        if (this.scroll) {
          this.endX = eventResolved.clientX;
          this.endY = eventResolved.clientY;
          this.main.scrollLeft = this.startX - this.endX;
          this.columnToScroll.scrollTop = this.startY - this.endY;
        }
      } else {
        const elements = document.elementsFromPoint(eventResolved.clientX, eventResolved.clientY);
        this.drag.style.transform = 'rotate(2deg)';
        this.drag.style.left = `${eventResolved.clientX - this.delta.x}px`;
        this.drag.style.top = `${eventResolved.clientY - this.delta.y}px`;
        Utils.renderSpace.call(this, eventResolved, this.drag);

        resolveScrolls(elements);
      }
    }));

    // Обработчики 'бросания' ячейки
    ['mouseup', 'touchend'].forEach((eventType) => this.board.addEventListener(eventType, async (event) => {
      if (this.timeout) clearTimeout(this.timeout);
      if (this.drag) {
        this.dancer.classList.remove('hidden');
        this.drag = await MoveItems.dropItem(event, this.drag, this.list.data);
        await this.update();
      }
      this.scroll = false;
    }));

    // Обработчики "ухода" курсора
    ['mouseleave', 'touchcancel'].forEach((eventName) => {
      this.page.addEventListener(eventName, async (event) => {
        if (this.drag) {
          this.drag = null;
          const e = (event.type === 'mouseleave') ? new Event('mouseup') : new Event('touchend');
          this.board.dispatchEvent(e);
          await this.update();
        } else {
          this.scroll = false;
        }
      });
    });
  }

  // Функция обновления содержимого
  async update(full = false) {
    try {
      Utils.reset();
      document.querySelectorAll('li.column-item').forEach((item) => item.remove());
      if (this.dancer.classList.contains('hidden')) { this.dancer.classList.remove('hidden'); }
      if (full) {
        this.page.querySelectorAll('.column-container').forEach((column) => { column.scrollTop = 0; });
        this.list = await Storage.request('fetch');
      }
    } catch (e) {
      alert(`Oops! Can't fetch the data! The following information may be helpful. ${e.message}`);
    } finally {
      if (this.list.data) {
        this.list.data.sort((a, b) => a.order - b.order).forEach((item) => Utils.render(item));
      }
      this.dancer.classList.add('hidden');
    }
  }
}
