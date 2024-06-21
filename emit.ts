// Define EventType as string or symbol
export type EventType = string | symbol;

// Event handler type that takes an optional event argument and returns void
export type Handler<T = unknown> = (event: T) => void;

// Wildcard event handler type that takes an event type and corresponding event argument
export type WildcardHandler<T = Record<string, unknown>> = (type: keyof T, event: T[keyof T]) => void;

// Type for an array of registered event handlers for a specific event type
export type EventHandlerList<T = unknown> = Array<Handler<T>>;

// Type for an array of wildcard event handlers
export type WildCardEventHandlerList<T = Record<string, unknown>> = Array<WildcardHandler<T>>;

// Type for a map of event types to their corresponding event handlers
export type EventHandlerMap<Events extends Record<EventType, unknown>> = Map<
  keyof Events | '*',
  EventHandlerList<Events[keyof Events]> | WildCardEventHandlerList<Events>
>;

// Interface for the event emitter
export interface Emitter<Events extends Record<EventType, unknown>> {
  all: EventHandlerMap<Events>;

  on<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void;
  on(type: '*', handler: WildcardHandler<Events>): void;

  off<Key extends keyof Events>(type: Key, handler?: Handler<Events[Key]>): void;
  off(type: '*', handler: WildcardHandler<Events>): void;

  emit<Key extends keyof Events>(type: Key, event: Events[Key]): void;
  emit<Key extends keyof Events>(type: undefined extends Events[Key] ? Key : never): void;
}

// Implementation of the mitt function, returning an event emitter
export default function mitt<Events extends Record<EventType, unknown>>(
  all?: EventHandlerMap<Events>
): Emitter<Events> {
  type GenericEventHandler = Handler<Events[keyof Events]> | WildcardHandler<Events>;
  all = all || new Map();

  return {
    all,

    on<Key extends keyof Events>(type: Key, handler: GenericEventHandler) {
      const handlers = all!.get(type) as Array<GenericEventHandler> | undefined;
      if (handlers) {
        handlers.push(handler);
      } else {
        all!.set(type, [handler] as EventHandlerList<Events[keyof Events]>);
      }
    },

    off<Key extends keyof Events>(type: Key, handler?: GenericEventHandler) {
      const handlers = all!.get(type) as Array<GenericEventHandler> | undefined;
      if (handlers) {
        if (handler) {
          handlers.splice(handlers.indexOf(handler) >>> 0, 1);
        } else {
          all!.set(type, []);
        }
      }
    },

    emit<Key extends keyof Events>(type: Key, evt?: Events[Key]) {
      let handlers = all!.get(type) as EventHandlerList<Events[keyof Events]> | undefined;
      if (handlers) {
        handlers.slice().forEach((handler) => {
          handler(evt!);
        });
      }

      handlers = all!.get('*') as WildCardEventHandlerList<Events> | undefined;
      if (handlers) {
        handlers.slice().forEach((handler) => {
          handler(type, evt!);
        });
      }
    }
  };
}
