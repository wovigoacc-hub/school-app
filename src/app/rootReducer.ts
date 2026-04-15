import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import activeChildReducer from '../store/slices/activeChildSlice';
import networkReducer from '../store/slices/networkSlice';
import uiReducer from '../store/slices/uiSlice';
import { api } from '../services/root/api';

const rootReducer = combineReducers({
    // RTK Query cache — must use api.reducerPath as the key
    [api.reducerPath]: api.reducer,

    // Client state slices
    auth: authReducer,
    activeChild: activeChildReducer,
    network: networkReducer,
    ui: uiReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;