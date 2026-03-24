import React from 'react';
import { createRoot } from 'react-dom/client';
import dayjs from 'dayjs';
import _ from 'lodash';

const App = () => {
  const data = [1, 2, 3, 4, 5];
  const chunked = _.chunk(data, 2);

  return (
    <div>
      <h1>React with Base & Lodash DLL Demo</h1>
      <p>Today is: {dayjs().format('YYYY-MM-DD HH:mm:ss')}</p>
      <div>
        <h3>Lodash Chunk Test:</h3>
        <pre>{JSON.stringify(chunked)}</pre>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
