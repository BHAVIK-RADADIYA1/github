import { all, fork } from 'redux-saga/effects';
import RepositoriesSaga from './repositoriesSaga';

export default function* rootSaga() {
  yield all([
    fork(RepositoriesSaga),
  ]);
} 