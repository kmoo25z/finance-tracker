from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import Transaction
from accounts.models import USAccount

class TransactionTestCase(TestCase):
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(username='testuser', password='testpass')
        
        # Create an API client
        self.client = APIClient()
        
        # Authenticate the client
        self.client.force_authenticate(user=self.user)
        
        # Create a test US account
        self.us_account = USAccount.objects.create(
            user=self.user,
            account_name='Test Account',
            balance=1000
        )
    
    def test_create_transaction(self):
        data = {
            'transaction_type': 'expense',
            'amount': 50.00,
            'currency': 'USD',
            'date': '2024-01-15',
            'description': 'Test expense',
            'us_account': self.us_account.id
        }
        
        response = self.client.post('/api/transactions/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Transaction.objects.count(), 1)
        
        transaction = Transaction.objects.first()
        self.assertEqual(transaction.amount, 50.00)
        self.assertEqual(transaction.user, self.user)
    
    def test_list_user_transactions(self):
        # Create transactions for different users
        other_user = User.objects.create_user(username='other', password='pass')
        
        Transaction.objects.create(
            user=self.user,
            transaction_type='income',
            amount=100,
            currency='USD',
            date='2024-01-15',
            description='My transaction'
        )
        
        Transaction.objects.create(
            user=other_user,
            transaction_type='income',
            amount=200,
            currency='USD',
            date='2024-01-15',
            description='Other user transaction'
        )
        
        response = self.client.get('/api/transactions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)  # Assuming pagination
        self.assertEqual(response.data['results'][0]['description'], 'My transaction')
    
    def test_unauthenticated_access(self):
        # Test that unauthenticated users can't access the API
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/transactions/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)