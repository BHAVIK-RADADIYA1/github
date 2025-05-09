import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import repositoriesReducer from './slices/repositoriesSlice';
import rootSaga from './sagas';

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    repositories: repositoriesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga); 