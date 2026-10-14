import { test, after, describe, mock } from 'node:test';
import assert from 'node:assert';
import conexao from '#db/singleton-connection.js';
import { criarLivro } from '#test/factories/livro.factory.js';
import { VendasService } from '#services/vendas.service.js';
import { assertMock } from '#test/utils/mock.assertions.js';
import { criarEditora } from '#test/factories/editora.factory.js';

describe('VendasService',() => {
    after(async () => {
        await conexao.destroy()
    })

    describe('registrarVenda', () => {
        test('Registra uma venda com sucesso e envia um email para a editora', async () => {
            
            //arrange
            const emailGatewayMock = {
                enviarEmail: mock.fn(),
            }// Mock

            const estoqueGatewayMock = {
                temEstoque: mock.fn( () => Promise.resolve(true)), // Stub
            }


            const sut = new VendasService(conexao, emailGatewayMock, estoqueGatewayMock);

            const editora = await criarEditora({
                email:'editora@teste.com',
            })
            const livro = await criarLivro({
                titulo:'Livro para Venda',
                editora_id: editora.id,
            });

            //act
            const resposta = await sut.registrarVenda({
                idLivro: livro.id,
                modoPagamento: 'PIX',
                valor:100
            })

            //assert 
            assert.equal(resposta.livro_id, livro.id)
            assert.equal(resposta.valor,95)
            assert.equal(resposta.tipo_pagamento, 'PIX')
            assertMock(emailGatewayMock.enviarEmail).wasCalledWith({
                destinatario: 'editora@teste.com',
                remetente: 'no-reply@livraria.com',     
                assunto: 'Nova venda registrada',
                mensagem: 'Uma nova venda do livro Livro para Venda foi registrada com o valor de R$ 95.',
            })
        })   
        
        
    })

    describe('registrarVenda', () => {
        test('Lança um erro quando o Livro não tem estoque disponível', async () => {
            
            //arrange
            const emailGatewayMock = {
                enviarEmail: mock.fn(),
            }// Mock

            const estoqueGatewayMock = {
                temEstoque: mock.fn( () => Promise.resolve(false)), // Stub
            } 

            const sut = new VendasService(conexao, emailGatewayMock, estoqueGatewayMock);

            const livro = await criarLivro({
                titulo:'Livro para Venda',           
            });

            //act - quando testamos uma parte que vai dar erro colocamos em uma callback () => e tira o await...
           
            const resposta = () => sut.registrarVenda({
                idLivro: livro.id,
                modoPagamento: 'PIX',
                valor: 100,
            });

            //assert
                await assert.rejects(resposta, {
                    message: 'Livro sem estoque disponivel',
                });
            })   
        
        
    })

})