import type { DesktopBridge } from "../shared/desktopBridge.js";

declare global {
  interface Window {
    desktopBridge: DesktopBridge;
  }
}

/**
 * Busca um elemento pelo id e confere o tipo; falha cedo se o HTML e o código divergirem.
 *
 * @example const button = requireElement("generate-button", HTMLButtonElement)
 */
export function requireElement<T extends HTMLElement>(id: string, type: new () => T): T {
  const element = document.getElementById(id);
  if (element instanceof type) return element;
  throw new Error(`Elemento #${id} ausente ou de outro tipo (recebido: ${element?.tagName ?? "nada"}; esperado: ${type.name}).`);
}
