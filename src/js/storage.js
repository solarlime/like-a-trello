export default class Storage {
  /**
   * PUT отправляет FormData: id, done, name, description, date
   * POST отправляет FormData: id, done или id, name, description
   * DELETE отправляет Formdata: id
   * GET не отправляет ничего в теле запроса
   */
  static request(command, data = '') {
    return new Promise((resolve, reject) => {
      const actions = {
        new: { method: 'PUT', url: 'new' },
        update: { method: 'POST', url: 'update' },
        delete: { method: 'DELETE', url: 'delete' },
        fetch: { method: 'GET', url: 'fetch' },
      };
      const action = actions[command];
      const xhr = new XMLHttpRequest();
      xhr.open(action.method, `/backend?action=${action.url}`);
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
        xhr.send();
      } else {
        xhr.send(data);
      }
    });
  }
}
