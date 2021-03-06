const assemblVersionNode = document.getElementById('assemblVersion');
const assemblVersion = assemblVersionNode ? assemblVersionNode.value : null;
const initialState = { assemblVersion: assemblVersion };

const ContextReducer = (state = initialState, action) => {
  switch (action.type) {
  case 'ADD_CONTEXT':
    return {
      ...state,
      rootPath: action.rootPath,
      debateId: action.debateId,
      connectedUserId: action.connectedUserId,
      connectedUserName: action.connectedUserName
    };
  default:
    return state;
  }
};

export default ContextReducer;

export const getConnectedUserId = (state) => {
  return state.context.connectedUserId;
};

export const getDebateId = (state) => {
  return state.context.debateId;
};

export const getLocale = (state) => {
  return state.i18n.locale;
};

export const getConnectedUserName = (state) => {
  return state.context.connectedUserName;
};