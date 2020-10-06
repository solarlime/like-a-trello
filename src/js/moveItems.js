/* eslint-disable no-param-reassign */
/* eslint-disable import/no-cycle */
import Storage from './storage';
import App from './app';
import Utils from './utils';

// Всех, кто меньше, уменьшаем на единицу кроме тех, кто меньше изначального
export default class MoveItems {
  static chooseItem(event, delta) {
    event.preventDefault();
    if (event.target.classList.contains('column-item-title')) {
      const eventResolved = Utils.eventResolver(event);
      // Указатель на перетаскиваемый элемент в DOM
      const drag = document.elementFromPoint(eventResolved.clientX, eventResolved.clientY).closest('li.column-item');
      if (drag) {
        drag.style.transform = 'rotate(2deg)';
        delta.x = eventResolved.pageX - drag.getBoundingClientRect().left;
        delta.y = eventResolved.pageY - drag.getBoundingClientRect().top;
        drag.classList.add('drag');
        drag.style.left = `${eventResolved.pageX - delta.x}px`;
        drag.style.top = `${eventResolved.pageY - delta.y}px`;
        drag.querySelector('.column-item-title').style.cursor = 'grabbing';
        return drag;
      }
    }
    return null;
  }

  static dropItem(event, drag) {
    if (drag) {
      // Новая колонка (если это именно она)
      const column = document
        .elementsFromPoint(event.clientX, event.clientY)
        .find((item) => item.classList.contains('column-container'));
      if (column) {
        MoveItems.putItem(event, column, drag);
      } else {
        drag.style.transform = '';
        drag.classList.remove('drag');
      }
    }
    return null;
  }

  static putItem(event, column, drag) {
    // Фиксируем старую колонку, понадобится при перестроении колонок
    const oldColumn = drag.closest('.column-container').id;
    const pointItem = document.elementsFromPoint(
      Utils.eventResolver(event).clientX,
      Utils.eventResolver(event).clientY,
    ).find(
      (item) => (item.classList.contains('column-item')
        || item.classList.contains('column-space')) && !item.classList.contains('drag'),
    );
    const dragId = drag.getAttribute('data-id');
    // Новая (возможно) колонка
    const targetColumn = document.elementsFromPoint(event.clientX, event.clientY)
      .find((item) => item.classList.contains('column-container')).id;
    const items = Storage.getItems();
    // Новый номер. В зависимости от ситуации присваиваться будет по-разному
    let endOrder;
    const dragOrder = parseInt(drag.getAttribute('data-order'), 10);
    // Определяем элемент, на котором произошло событие mousedown / touchend
    // eslint-disable-next-line func-names
    const endItem = (function resolveItem() {
      const item = (pointItem?.classList.contains('column-item')) ? pointItem : null;
      if (item) {
        const { top } = item.getBoundingClientRect();
        if (event.pageY > window.scrollY + top + item.offsetHeight / 2) {
          // Навели ниже середины ячейки
          return item.nextElementSibling.nextElementSibling;
        }
        // Навели выше середины ячейки
        return item;
      }
      // Навели на заполнитель или пустое место
      return (pointItem?.nextElementSibling) ? pointItem.nextElementSibling : null;
    }());

    // Вариант 1. Колонка не меняется
    if (targetColumn === oldColumn) {
      // 1.1. Mouseup на пустом месте
      if (!endItem) {
        endOrder = items.filter((item) => item.column === targetColumn).length;
      } else {
        // Исправляем "перепрыгивание" при перетаскивании вниз
        endOrder = (function fixJumping() {
          const parsed = parseInt(endItem.getAttribute('data-order'), 10);
          return (dragOrder > parsed) ? parsed : parsed - 1;
        }());
      }
      items.find((item) => item.id === dragId).order = endOrder;
      // На основе dragOrder и endOrder меняем остальные номера
      items.filter((item) => item.column === oldColumn
        && item.id !== dragId)
        .map((item) => {
          const parsedOrder = parseInt(item.order, 10);
          // Если ячейка переместилась наверх,
          // то номера между dragOrder и endOrder увеличиваются на 1
          if (endOrder < dragOrder
            && parsedOrder >= endOrder && parsedOrder < dragOrder) {
            item.order = parsedOrder + 1;
          }
          // Иначе - наоборот
          if (endOrder >= dragOrder
            && parsedOrder <= endOrder && parsedOrder > dragOrder) {
            item.order = parsedOrder - 1;
          }
          return item;
        });
    //  Вариант 2. Колонка изменилась
    } else {
      // В старой колонке заполняем появившуюся пустоту
      items.filter((item) => item.column === oldColumn
        && parseInt(item.order, 10) > dragOrder)
        .map((item) => {
          const parsedOrder = parseInt(item.order, 10);
          item.order = parsedOrder - 1;
          return item;
        });
      const targetItem = items.find((item) => item.id === dragId);
      // 2.1. Mouseup на пустом месте
      if (!endItem) {
        endOrder = items.filter((item) => item.column === targetColumn).length + 1;
      //  2.2 Mouseup на одной из ячеек
      } else {
        endOrder = parseInt(endItem.getAttribute('data-order'), 10);
        // Ячейки с номером > endOrder увеличиваем на 1
        items.filter((item) => item.column === targetColumn
          && parseInt(item.order, 10) >= endOrder)
          .map((item) => {
            const parsedOrder = parseInt(item.order, 10);
            item.order = parsedOrder + 1;
            return item;
          });
      }
      targetItem.column = targetColumn;
      targetItem.order = endOrder;
    }
    Storage.setItems(items);
    App.update();
  }
}
