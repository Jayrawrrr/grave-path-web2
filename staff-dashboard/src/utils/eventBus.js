// Event bus for global state changes
const eventBus = {
  listeners: {},

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  },

  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }
};

export const EVENTS = {
  LOT_UPDATED: 'lotUpdated',
  RESERVATION_CHANGED: 'reservationChanged',
  LOT_DELETED: 'lotDeleted',
  LOT_CREATED: 'lotCreated',
  GRAVE_LOCATOR_NAVIGATE: 'graveLocatorNavigate',
  COLUMBARIUM_SEARCH_NAVIGATE: 'columbariumSearchNavigate'
};

export default eventBus; 