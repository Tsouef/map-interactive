import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from 'react';
import { useClickOutside } from '../useClickOutside';

describe('useClickOutside', () => {
  const TestComponent = ({ onClickOutside }: { onClickOutside: () => void }) => {
    const ref = useRef<HTMLDivElement>(null);
    useClickOutside(ref, onClickOutside);

    return (
      <div>
        <div ref={ref} data-testid="inside">
          Inside element
          <button data-testid="inside-button">Inside button</button>
        </div>
        <button data-testid="outside-button">Outside button</button>
      </div>
    );
  };

  it('should not call handler when clicking inside element', async () => {
    const user = userEvent.setup();
    const handleClickOutside = jest.fn();
    
    render(<TestComponent onClickOutside={handleClickOutside} />);
    
    await user.click(screen.getByTestId('inside'));
    expect(handleClickOutside).not.toHaveBeenCalled();
    
    await user.click(screen.getByTestId('inside-button'));
    expect(handleClickOutside).not.toHaveBeenCalled();
  });

  it('should call handler when clicking outside element', async () => {
    const user = userEvent.setup();
    const handleClickOutside = jest.fn();
    
    render(<TestComponent onClickOutside={handleClickOutside} />);
    
    await user.click(screen.getByTestId('outside-button'));
    expect(handleClickOutside).toHaveBeenCalledTimes(1);
  });

  it('should call handler when clicking on document body', async () => {
    const user = userEvent.setup();
    const handleClickOutside = jest.fn();
    
    render(<TestComponent onClickOutside={handleClickOutside} />);
    
    await user.click(document.body);
    expect(handleClickOutside).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple refs', () => {
    const TestMultipleRefs = ({ onClickOutside }: { onClickOutside: () => void }) => {
      const ref1 = useRef<HTMLDivElement>(null);
      const ref2 = useRef<HTMLDivElement>(null);
      
      useClickOutside([ref1, ref2], onClickOutside);

      return (
        <div>
          <div ref={ref1} data-testid="ref1">Ref 1</div>
          <div ref={ref2} data-testid="ref2">Ref 2</div>
          <button data-testid="outside">Outside</button>
        </div>
      );
    };

    const handleClickOutside = jest.fn();
    render(<TestMultipleRefs onClickOutside={handleClickOutside} />);
    
    // Click inside ref1
    userEvent.click(screen.getByTestId('ref1'));
    expect(handleClickOutside).not.toHaveBeenCalled();
    
    // Click inside ref2
    userEvent.click(screen.getByTestId('ref2'));
    expect(handleClickOutside).not.toHaveBeenCalled();
    
    // Click outside both
    userEvent.click(screen.getByTestId('outside'));
    expect(handleClickOutside).toHaveBeenCalledTimes(1);
  });

  it('should cleanup event listener on unmount', () => {
    const handleClickOutside = jest.fn();
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    
    const { unmount } = render(<TestComponent onClickOutside={handleClickOutside} />);
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
  });

  it('should update handler reference', async () => {
    const user = userEvent.setup();
    const firstHandler = jest.fn();
    const secondHandler = jest.fn();
    
    const { rerender } = render(<TestComponent onClickOutside={firstHandler} />);
    
    await user.click(screen.getByTestId('outside-button'));
    expect(firstHandler).toHaveBeenCalledTimes(1);
    expect(secondHandler).not.toHaveBeenCalled();
    
    // Change handler
    rerender(<TestComponent onClickOutside={secondHandler} />);
    
    await user.click(screen.getByTestId('outside-button'));
    expect(firstHandler).toHaveBeenCalledTimes(1); // Still 1
    expect(secondHandler).toHaveBeenCalledTimes(1);
  });

  it('should handle null refs gracefully', async () => {
    const user = userEvent.setup();
    const TestNullRef = ({ onClickOutside }: { onClickOutside: () => void }) => {
      const ref = useRef<HTMLDivElement>(null);
      useClickOutside(ref, onClickOutside);
      
      // Don't attach ref to any element
      return (
        <div>
          <button data-testid="button">Button</button>
        </div>
      );
    };
    
    const handleClickOutside = jest.fn();
    render(<TestNullRef onClickOutside={handleClickOutside} />);
    
    await user.click(screen.getByTestId('button'));
    expect(handleClickOutside).toHaveBeenCalledTimes(1);
  });

  it('should work with touch events', async () => {
    const handleClickOutside = jest.fn();
    render(<TestComponent onClickOutside={handleClickOutside} />);
    
    // Simulate touch outside
    const touchEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [{ target: document.body } as any]
    });
    
    document.dispatchEvent(touchEvent);
    
    expect(handleClickOutside).toHaveBeenCalledTimes(1);
  });

  it('should handle disabled state', () => {
    const TestDisabledState = ({ 
      onClickOutside, 
      disabled 
    }: { 
      onClickOutside: () => void;
      disabled?: boolean;
    }) => {
      const ref = useRef<HTMLDivElement>(null);
      useClickOutside(ref, onClickOutside, disabled);

      return (
        <div>
          <div ref={ref} data-testid="inside">Inside</div>
          <button data-testid="outside">Outside</button>
        </div>
      );
    };

    const handleClickOutside = jest.fn();
    const { rerender } = render(
      <TestDisabledState onClickOutside={handleClickOutside} disabled={true} />
    );
    
    userEvent.click(screen.getByTestId('outside'));
    expect(handleClickOutside).not.toHaveBeenCalled();
    
    // Enable
    rerender(<TestDisabledState onClickOutside={handleClickOutside} disabled={false} />);
    
    userEvent.click(screen.getByTestId('outside'));
    expect(handleClickOutside).toHaveBeenCalledTimes(1);
  });
});