from django.db import models

class User(models.Model):
    name = models.CharField('name', max_length=20)
    password_hash = models.CharField('password_hash', max_length=32)

    def __str__(self):
        return f'User[name={self.name}]'

class Category(models.Model):
    name = models.CharField('name', max_length=20)
    def __str__(self):
        return f'Category[name={self.name}]'

class Item(models.Model):
    name = models.CharField('name', max_length=50)
    category = models.ForeignKey('Category', on_delete=models.CASCADE)

