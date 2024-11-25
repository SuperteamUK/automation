import {
  HStack,
  Modal,
  ModalContent,
  ModalOverlay,
  Spinner,
  Text,
} from '@chakra-ui/react';

interface LoadingModalProps {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  text?: string;
}
const LoadingModal = ({
  isLoading,
  setIsLoading,
  text = 'Loading...',
}: LoadingModalProps) => {
  return isLoading ? (
    <Modal isOpen={isLoading} onClose={() => setIsLoading(false)}>
      <ModalOverlay />
      <ModalContent p={8}>
        <HStack gap={2}>
          <Text>{text}</Text>
          <Spinner />
        </HStack>
      </ModalContent>
    </Modal>
  ) : (
    <></>
  );
};
export { LoadingModal };
