/**
 * Biblioteca de animações reutilizáveis com Framer Motion
 * 
 * @description Variants padronizados para componentes do design system.
 * Garante consistência visual e UX em toda aplicação.
 * 
 * @module animations
 * @example
 * ```tsx
 * import { modalVariants, fadeInVariants } from '@/lib/animations';
 * 
 * <motion.div variants={modalVariants} initial="initial" animate="animate" exit="exit">
 *   // Modal content
 * </motion.div>
 * ```
 */

import { Variants, Transition } from 'framer-motion';

/**
 * Transition padrão para todas as animações
 * 
 * Utiliza curva de easing moderna (ease-out) para movimento natural.
 * Duração de 200ms é percebida como instantânea mas visível.
 */
export const defaultTransition: Transition = {
  duration: 0.2,
  ease: [0.4, 0.0, 0.2, 1], // cubic-bezier equivalente ao ease-out do Material Design
};

/**
 * Variants para modais e dialogs
 * 
 * @description Animação de scale + opacity para entrada/saída suave.
 * Escala inicial de 0.95 (95%) cria efeito de "popup" sutil.
 * 
 * @usage Dialog, AlertDialog, Modal components
 * 
 * @example
 * ```tsx
 * <Dialog>
 *   <DialogContent asChild>
 *     <motion.div
 *       variants={modalVariants}
 *       initial="initial"
 *       animate="animate"
 *       exit="exit"
 *     >
 *       {children}
 *     </motion.div>
 *   </DialogContent>
 * </Dialog>
 * ```
 */
export const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: defaultTransition,
  },
};

/**
 * Variants para dropdowns e popovers
 * 
 * @description Animação de slide vertical + opacity.
 * Movimento de -10px cria efeito de "cair" do trigger.
 * 
 * @usage DropdownMenu, Select, Popover, Combobox
 * 
 * @example
 * ```tsx
 * <DropdownMenuContent asChild>
 *   <motion.div
 *     variants={dropdownVariants}
 *     initial="initial"
 *     animate="animate"
 *     exit="exit"
 *   >
 *     {items.map(...)}
 *   </motion.div>
 * </DropdownMenuContent>
 * ```
 */
export const dropdownVariants: Variants = {
  initial: {
    opacity: 0,
    y: -10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: defaultTransition,
  },
};

/**
 * Variants para fade in simples
 * 
 * @description Apenas opacity, sem movimento.
 * Útil para conteúdo que não deve chamar muita atenção.
 * 
 * @usage Toast, Notification badge, Loading overlays
 * 
 * @example
 * ```tsx
 * <motion.div
 *   variants={fadeInVariants}
 *   initial="initial"
 *   animate="animate"
 * >
 *   <p>Conteúdo aparece suavemente</p>
 * </motion.div>
 * ```
 */
export const fadeInVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    transition: defaultTransition,
  },
};

/**
 * Variants para slide in (entrada lateral)
 * 
 * @description Movimento horizontal + opacity.
 * Direção configurável via custom prop.
 * 
 * @usage Sidebar, Sheet, Drawer, Navigation panels
 * 
 * @example
 * ```tsx
 * // Slide from right (default)
 * <motion.div
 *   variants={slideInVariants}
 *   initial="initial"
 *   animate="animate"
 *   exit="exit"
 * >
 *   <Sheet content />
 * </motion.div>
 * 
 * // Slide from left
 * <motion.div
 *   variants={slideInVariants}
 *   initial="initial"
 *   animate="animate"
 *   exit="exit"
 *   custom="left"
 * >
 *   <Sidebar />
 * </motion.div>
 * ```
 */
export const slideInVariants: Variants = {
  initial: (direction: 'left' | 'right' = 'right') => ({
    opacity: 0,
    x: direction === 'right' ? 20 : -20,
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: defaultTransition,
  },
  exit: (direction: 'left' | 'right' = 'right') => ({
    opacity: 0,
    x: direction === 'right' ? 20 : -20,
    transition: defaultTransition,
  }),
};

/**
 * Variants para lista de itens (stagger children)
 * 
 * @description Container que anima filhos em sequência.
 * Delay de 50ms entre cada item cria efeito cascata.
 * 
 * @usage Listas, grids, resultados de busca
 * 
 * @example
 * ```tsx
 * <motion.ul variants={listContainerVariants} initial="initial" animate="animate">
 *   {items.map((item) => (
 *     <motion.li key={item.id} variants={listItemVariants}>
 *       {item.name}
 *     </motion.li>
 *   ))}
 * </motion.ul>
 * ```
 */
export const listContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05, // 50ms entre cada filho
    },
  },
};

/**
 * Variants para itens de lista (usar com listContainerVariants)
 * 
 * @description Item individual animado pelo parent container.
 * Movimento vertical sutil + opacity.
 */
export const listItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
};

/**
 * Variants para badge/count animado
 * 
 * @description Scale + opacity com bounce.
 * Útil para contadores que atualizam (notificações, carrinho).
 * 
 * @usage Badge com número, notification count, cart items
 * 
 * @example
 * ```tsx
 * <motion.span
 *   key={count} // Key force remount para re-animar
 *   variants={badgeVariants}
 *   initial="initial"
 *   animate="animate"
 * >
 *   {count}
 * </motion.span>
 * ```
 */
export const badgeVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.5,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      ...defaultTransition,
      type: 'spring',
      stiffness: 500,
      damping: 25,
    },
  },
};

/**
 * Variants para skeleton/loading placeholder
 * 
 * @description Pulse effect com opacity.
 * Loop infinito para indicar carregamento.
 * 
 * @usage Skeleton components, loading states
 * 
 * @example
 * ```tsx
 * <motion.div
 *   className="h-4 bg-muted rounded"
 *   variants={skeletonVariants}
 *   animate="animate"
 * />
 * ```
 */
export const skeletonVariants: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};
