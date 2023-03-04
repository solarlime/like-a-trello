export default class Storage {
  /**
   * POST отправляет JSON: id, order, column, name, files
   * PUT отправляет FormData: id, order, column или id, name, files
   * DELETE отправляет JSON: id
   * GET не отправляет ничего в теле запроса
   */
  static request(command, data = '') {
    return new Promise((resolve, reject) => {
      const actions = {
        new: { method: 'POST', url: 'new' },
        update: { method: 'PUT', url: 'update' },
        delete: { method: 'DELETE', url: 'delete' },
        fetch: { method: 'GET', url: 'fetch' },
      };
      const action = actions[command];
      const xhr = new XMLHttpRequest();
      xhr.open(action.method, `${process.env.HOST}/like-a-trello/${action.url}`);
      xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.response);
          resolve(response);
        } catch (e) {
          reject(Error(`Server response: ${xhr.response}`));
        }
      });

      xhr.addEventListener('error', (error) => {
        reject(error);
      });

      if (action.method === 'GET') {
        xhr.setRequestHeader('cache-control', 'no-cache');
        xhr.send();
      } else {
        xhr.send(data);
      }
    });
  }
}
